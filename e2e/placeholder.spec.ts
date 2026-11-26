import { expect, test } from '@playwright/test'

test('placeholder screen shows the app heading', async ({ page }) => {
  await page.goto('/')
  await expect(
    page.getByRole('heading', { level: 1, name: 'odd-todo-app' }),
  ).toBeVisible()
})
