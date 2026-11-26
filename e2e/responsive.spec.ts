import { expect, test } from '@playwright/test'

test('layout is usable at 375px width with no horizontal scroll', async ({
  page,
}) => {
  page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/')
  await expect(
    page.getByRole('heading', { level: 1, name: 'odd-todo-app' }),
  ).toBeVisible()
  const widths = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }))
  expect(widths.scrollWidth).toBeLessThanOrEqual(widths.clientWidth)
})
