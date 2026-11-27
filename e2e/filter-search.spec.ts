import { expect, test, type Page } from '@playwright/test'

// Contract under test (odd/tasks/filter-search.md, wired by the orchestrator
// in src/app/App.tsx): "/" renders the "Search tasks" input and the "Show"
// select above the task list; the filter state lives in ?q=&status=.

const searchBox = (page: Page) =>
  page.getByRole('textbox', { name: 'Search tasks' })
const showSelect = (page: Page) => page.getByRole('combobox', { name: 'Show' })
const rows = (page: Page) => page.getByRole('listitem')

async function addTask(page: Page, text: string) {
  const input = page.getByRole('textbox', { name: 'New task' })
  await input.fill(text)
  await input.press('Enter')
}

async function searchParams(page: Page) {
  const url = new URL(page.url())
  return url.searchParams
}

test('search and status combine, update the URL without new history entries, and survive reload (S1-S4)', async ({
  page,
}) => {
  await page.goto('/')
  await addTask(page, 'Buy milk')
  await addTask(page, 'Pay rent')
  await page.getByRole('checkbox', { name: 'Buy milk' }).check()

  const historyLength = await page.evaluate(() => window.history.length)

  // S1: case-insensitive match on the trimmed query
  await searchBox(page).fill('  MILK ')
  await expect(rows(page)).toHaveCount(1)
  await expect(rows(page).first()).toContainText('Buy milk')
  await expect
    .poll(async () => (await searchParams(page)).get('q'))
    .toBe('  MILK ')

  // S2 + S3: status combines with search; no match shows the right message
  await showSelect(page).selectOption('active')
  await expect(page.getByText('No tasks match.')).toBeVisible()
  await expect(page.getByText('No tasks yet.')).toHaveCount(0)
  await expect(rows(page)).toHaveCount(0)
  await expect
    .poll(async () => (await searchParams(page)).get('status'))
    .toBe('active')
  expect((await searchParams(page)).get('q')).toBe('  MILK ')

  // S4: changes replace the entry — history never grows
  expect(await page.evaluate(() => window.history.length)).toBe(historyLength)

  // S4: a reload restores the same view
  await page.reload()
  await expect(searchBox(page)).toHaveValue('  MILK ')
  await expect(showSelect(page)).toHaveValue('active')
  await expect(page.getByText('No tasks match.')).toBeVisible()

  // S5: filtering never changed what is stored — both tasks are still there
  await showSelect(page).selectOption('all')
  await searchBox(page).fill('')
  await expect(rows(page)).toHaveCount(2)
  await expect(rows(page).first()).toContainText('Pay rent')
})

test('deep link ?q=milk&status=active restores controls and visible rows (S4)', async ({
  page,
}) => {
  await page.goto('/')
  await addTask(page, 'Buy milk')
  await addTask(page, 'Buy bread')
  await page.getByRole('checkbox', { name: 'Buy bread' }).check()

  await page.goto('/?q=milk&status=active')
  await expect(searchBox(page)).toHaveValue('milk')
  await expect(showSelect(page)).toHaveValue('active')
  await expect(rows(page)).toHaveCount(1)
  await expect(rows(page).first()).toContainText('Buy milk')
})

test('an unknown status value behaves as All (S4)', async ({ page }) => {
  await page.goto('/')
  await addTask(page, 'Buy milk')
  await addTask(page, 'Pay rent')

  await page.goto('/?status=bogus')
  await expect(showSelect(page)).toHaveValue('all')
  await expect(rows(page)).toHaveCount(2)
})

test('default values are omitted from the URL (S4)', async ({ page }) => {
  await page.goto('/')
  await addTask(page, 'Buy milk')
  await searchBox(page).fill('milk')
  await expect
    .poll(async () => (await searchParams(page)).get('q'))
    .toBe('milk')
  await searchBox(page).fill('')
  await expect.poll(async () => new URL(page.url()).search).toBe('')
})

test('empty states never show both messages (S3)', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('No tasks yet.')).toBeVisible()
  await expect(page.getByText('No tasks match.')).toHaveCount(0)

  await addTask(page, 'Buy milk')
  await searchBox(page).fill('zzz')
  await expect(page.getByText('No tasks match.')).toBeVisible()
  await expect(page.getByText('No tasks yet.')).toHaveCount(0)

  await searchBox(page).fill('')
  await expect(rows(page)).toHaveCount(1)

  await page.getByRole('button', { name: 'Delete Buy milk' }).click()
  await expect(page.getByText('No tasks yet.')).toBeVisible()
  await expect(page.getByText('No tasks match.')).toHaveCount(0)
})

test('controls work at 375px with no horizontal scroll (S6)', async ({
  page,
}) => {
  page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/')
  await addTask(page, 'Buy milk')
  await searchBox(page).fill('milk')
  await showSelect(page).selectOption('active')
  await expect(searchBox(page)).toBeVisible()
  await expect(showSelect(page)).toBeVisible()
  const widths = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }))
  expect(widths.scrollWidth).toBeLessThanOrEqual(widths.clientWidth)
})
