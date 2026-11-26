import { expect, test } from '@playwright/test'

test('the app heading is visible', async ({ page }) => {
  await page.goto('/')
  await expect(
    page.getByRole('heading', { level: 1, name: 'odd-todo-app' }),
  ).toBeVisible()
})
