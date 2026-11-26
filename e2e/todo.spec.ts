import { expect, test } from '@playwright/test'

const input = (page: import('@playwright/test').Page) =>
  page.getByRole('textbox', { name: 'New task' })

async function addTask(page: import('@playwright/test').Page, text: string) {
  await input(page).fill(text)
  await input(page).press('Enter')
}

test('add, complete and delete survive a reload (S5)', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('No tasks yet.')).toBeVisible()

  await addTask(page, 'Buy milk')
  await addTask(page, 'Pay rent')
  // newest first
  const items = page.getByRole('listitem')
  await expect(items).toHaveCount(2)
  await expect(items.first()).toContainText('Pay rent')

  await page.getByRole('checkbox', { name: 'Buy milk' }).check()
  // S3 visual claim proven in a real browser: line-through + muted color token
  const doneStyle = await page
    .getByRole('checkbox', { name: 'Buy milk' })
    .evaluate((box) => {
      const label = document.querySelector(
        `label[for="${(box as HTMLInputElement).id}"]`,
      ) as HTMLElement
      const s = window.getComputedStyle(label)
      return { decoration: s.textDecorationLine, color: s.color }
    })
  expect(doneStyle.decoration).toBe('line-through')
  expect(doneStyle.color).toBe('rgb(82, 96, 109)') // --color-text-muted, light

  await page.getByRole('button', { name: 'Delete Pay rent' }).click()

  await page.reload()

  await expect(items).toHaveCount(1)
  await expect(
    page.getByRole('checkbox', { name: 'Buy milk' }),
  ).toBeChecked()

  await page.getByRole('button', { name: 'Delete Buy milk' }).click()
  await expect(page.getByText('No tasks yet.')).toBeVisible()
})

test('error messages appear in the browser (S1)', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Add' }).click()
  await expect(page.getByRole('alert')).toHaveText('Write a task first.')

  await input(page).fill('x'.repeat(121))
  await page.getByRole('button', { name: 'Add' }).click()
  await expect(page.getByRole('alert')).toHaveText(
    'Keep it to 120 characters or fewer.',
  )

  await input(page).fill('Buy milk')
  await page.getByRole('button', { name: 'Add' }).click()
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(input(page)).toBeFocused()
})

test('long task at 375px: no horizontal scroll (S6)', async ({ page }) => {
  page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/')
  await addTask(page, `${'word '.repeat(20)}${'x'.repeat(60)}`)
  await expect(
    page.getByRole('heading', { level: 1, name: 'odd-todo-app' }),
  ).toBeVisible()
  const widths = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }))
  expect(widths.scrollWidth).toBeLessThanOrEqual(widths.clientWidth)
})
