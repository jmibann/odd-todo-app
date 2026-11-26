import { expect, test } from '@playwright/test'
import { readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const STORAGE_KEY = ['odd-todo-app', 'tasks'].join(':')

async function addTask(page: import('@playwright/test').Page, text: string) {
  const input = page.getByRole('textbox', { name: 'New task' })
  await input.fill(text)
  await input.press('Enter')
}

function localDate(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

test('export then import round-trips the list across reload (S1, S2, S4)', async ({
  page,
}) => {
  await page.goto('/')
  await addTask(page, 'Buy milk')
  await addTask(page, 'Pay rent')
  await page.getByRole('checkbox', { name: 'Pay rent' }).check()

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export tasks' }).click(),
  ])
  expect(download.suggestedFilename()).toBe(
    `odd-todo-backup-${localDate()}.json`,
  )
  const downloadPath = await download.path()
  const payload = JSON.parse(readFileSync(downloadPath as string, 'utf8'))
  expect(payload.version).toBe(1)
  expect(payload.tasks.map((t: { text: string }) => t.text)).toEqual([
    'Pay rent',
    'Buy milk',
  ])
  expect(payload.tasks[0].completed).toBe(true)

  // wipe the current list
  await page.getByRole('button', { name: 'Delete Pay rent' }).click()
  await page.getByRole('button', { name: 'Delete Buy milk' }).click()
  await expect(page.getByText('No tasks yet.')).toBeVisible()

  // import the downloaded file
  await page
    .locator('input[type="file"]')
    .setInputFiles(downloadPath as string)
  await expect(
    page.getByText('Replace current tasks (0) with imported tasks (2)?'),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Replace' }).click()
  await expect(page.getByRole('listitem')).toHaveCount(2)

  await page.reload()
  await expect(page.getByRole('listitem')).toHaveCount(2)
  await expect(
    page.getByRole('checkbox', { name: 'Pay rent' }),
  ).toBeChecked()
})

test('cancel keeps everything, invalid files change nothing (S2, S3)', async ({
  page,
}) => {
  await page.goto('/')
  await addTask(page, 'Keep me')
  const before = await page.evaluate(
    (key: string) => localStorage.getItem(key),
    STORAGE_KEY,
  )

  // valid file, but cancel
  const goodPath = join(tmpdir(), 'backup-good.json')
  writeFileSync(
    goodPath,
    JSON.stringify({
      format: 'odd-todo-app/backup',
      version: 1,
      exportedAt: new Date().toISOString(),
      tasks: [{ id: 'x', text: 'Imported', completed: false }],
    }),
  )
  await page.locator('input[type="file"]').setInputFiles(goodPath)
  await page.getByRole('button', { name: 'Cancel' }).click()
  await expect(page.getByText('Keep me')).toBeVisible()
  await expect(page.getByText('Imported')).toHaveCount(0)

  // invalid file: not JSON
  const badPath = join(tmpdir(), 'backup-bad.json')
  writeFileSync(badPath, '{definitely not json')
  await page.locator('input[type="file"]').setInputFiles(badPath)
  await expect(page.getByRole('alert')).toHaveText(
    "This file can't be imported.",
  )
  await expect(page.getByText('Keep me')).toBeVisible()
  const after = await page.evaluate(
    (key: string) => localStorage.getItem(key),
    STORAGE_KEY,
  )
  expect(after).toBe(before)
})

test('empty-list export and 375px with the confirmation open (S1, S7)', async ({
  page,
}) => {
  page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/')

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export tasks' }).click(),
  ])
  const downloadPath = await download.path()
  const payload = JSON.parse(readFileSync(downloadPath as string, 'utf8'))
  expect(payload.tasks).toEqual([])

  await addTask(page, 'Long task '.repeat(8) + 'x'.repeat(40))
  await page.locator('input[type="file"]').setInputFiles(downloadPath as string)
  await expect(
    page.getByText('Replace current tasks (1) with imported tasks (0)?'),
  ).toBeVisible()
  const widths = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }))
  expect(widths.scrollWidth).toBeLessThanOrEqual(widths.clientWidth)
})
