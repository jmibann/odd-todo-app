import { expect, test } from '@playwright/test'

const STORAGE_KEY = ['odd-todo-app', 'tasks'].join(':')

/* Written against the integration contract (undo-delete.md T5/T6): on `/`,
 * deleting a task renders "Task deleted." with an "Undo" button inside a
 * role="status" region for 5 s. Run once App is wired to useUndoDelete. */

const input = (page: import('@playwright/test').Page) =>
  page.getByRole('textbox', { name: 'New task' })

async function addTask(page: import('@playwright/test').Page, text: string) {
  await input(page).fill(text)
  await input(page).press('Enter')
}

async function deleteTask(page: import('@playwright/test').Page, text: string) {
  await page.getByRole('button', { name: `Delete ${text}` }).click()
}

async function storedIds(page: import('@playwright/test').Page): Promise<string[]> {
  const raw = await page.evaluate(
    (key: string) => localStorage.getItem(key),
    STORAGE_KEY,
  )
  return ((JSON.parse(raw ?? '[]') ?? []) as { id: string }[]).map(
    (task) => task.id,
  )
}

test('delete shows "Task deleted." with an Undo button in a status region (S6)', async ({
  page,
}) => {
  await page.goto('/')
  await addTask(page, 'Buy milk')
  await deleteTask(page, 'Buy milk')

  const status = page.getByRole('status')
  await expect(status.getByText('Task deleted.')).toBeVisible()
  await expect(
    status.getByRole('button', { name: 'Undo' }),
  ).toBeVisible()
})

test('Undo restores the task at its original position and clears the message (S7)', async ({
  page,
}) => {
  await page.goto('/')
  await addTask(page, 'Task A')
  await addTask(page, 'Task B')
  await addTask(page, 'Task C')
  // newest first: C, B, A
  await expect(page.getByRole('listitem')).toHaveCount(3)

  await deleteTask(page, 'Task B')
  await expect(page.getByRole('status').getByText('Task deleted.')).toBeVisible()

  await page.getByRole('button', { name: 'Undo' }).click()
  await expect(page.getByRole('status')).toHaveText('')
  const items = page.getByRole('listitem')
  await expect(items).toHaveCount(3)
  await expect(items.nth(0)).toContainText('Task C')
  await expect(items.nth(1)).toContainText('Task B')
  await expect(items.nth(2)).toContainText('Task A')
})

test('the message auto-dismisses after 5 seconds and the delete stands (S6)', async ({
  page,
}) => {
  await page.goto('/')
  await addTask(page, 'Buy milk')
  await deleteTask(page, 'Buy milk')
  await expect(page.getByRole('status').getByText('Task deleted.')).toBeVisible()

  // past the 5 s window the message (and its Undo button) are gone
  await expect(page.getByText('Task deleted.')).toBeHidden({ timeout: 8000 })
  await expect(page.getByRole('button', { name: 'Undo' })).toHaveCount(0)
  await expect(page.getByRole('listitem')).toHaveCount(0)
})

test('only the latest deletion can be undone (S8)', async ({ page }) => {
  await page.goto('/')
  await addTask(page, 'First delete')
  await addTask(page, 'Second delete')

  await deleteTask(page, 'First delete')
  await deleteTask(page, 'Second delete')
  await expect(page.getByRole('status').getByText('Task deleted.')).toBeVisible()

  await page.getByRole('button', { name: 'Undo' }).click()
  // the second deletion is undone; the first became final
  await expect(page.getByRole('listitem')).toHaveCount(1)
  await expect(page.getByText('Second delete')).toBeVisible()
  await expect(page.getByText('First delete')).toHaveCount(0)
})

test('the delete persists immediately: reload in the window shows no message (S9)', async ({
  page,
}) => {
  await page.goto('/')
  await addTask(page, 'Buy milk')
  await addTask(page, 'Keep me')

  await deleteTask(page, 'Buy milk')
  // stored JSON already lacks it before any undo or timeout
  const ids = await storedIds(page)
  expect(ids).toHaveLength(1)
  const raw = await page.evaluate(
    (key: string) => localStorage.getItem(key),
    STORAGE_KEY,
  )
  expect(raw).toContain('Keep me')
  expect(raw).not.toContain('Buy milk')

  await page.reload()
  await expect(page.getByText('Task deleted.')).toHaveCount(0)
  await expect(page.getByRole('listitem')).toHaveCount(1)
  await expect(page.getByText('Keep me')).toBeVisible()
})

test('the snackbar at 375px: no horizontal scroll (S11)', async ({ page }) => {
  page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/')
  const longTask = `${'word '.repeat(20)}${'x'.repeat(60)}`
  await addTask(page, longTask)
  await deleteTask(page, longTask)
  await expect(page.getByRole('status').getByText('Task deleted.')).toBeVisible()
  const widths = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }))
  expect(widths.scrollWidth).toBeLessThanOrEqual(widths.clientWidth)
})
