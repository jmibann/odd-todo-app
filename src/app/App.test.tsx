import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App.tsx'

function stubMatchMedia(prefersDark: boolean) {
  const mq = {
    matches: prefersDark,
    addEventListener: () => {},
    removeEventListener: () => {},
  }
  window.matchMedia = vi.fn().mockImplementation(() => mq)
}

beforeEach(() => {
  window.localStorage.clear()
  delete document.documentElement.dataset.theme
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  delete (window as unknown as { matchMedia?: unknown }).matchMedia
})

describe('placeholder screen', () => {
  it('shows a single heading with the text "odd-todo-app"', () => {
    stubMatchMedia(false)
    render(<App />)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading.textContent).toBe('odd-todo-app')
    expect(screen.getAllByRole('heading')).toHaveLength(1)
  })

  it('follows the operating system preference by default', () => {
    stubMatchMedia(true)
    render(<App />)
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(
      screen.getByRole('button', { name: 'Switch to light theme' }),
    ).toBeTruthy()
  })

  it('the toggle overrides the theme and persists across reloads', () => {
    stubMatchMedia(false)
    const first = render(<App />)
    expect(document.documentElement.dataset.theme).toBe('light')

    fireEvent.click(screen.getByRole('button', { name: 'Switch to dark theme' }))
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(
      screen.getByRole('button', { name: 'Switch to light theme' }),
    ).toBeTruthy()

    // reload: fresh mount, same OS (light), but the stored choice must win
    first.unmount()
    stubMatchMedia(false)
    render(<App />)
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(
      screen.getByRole('button', { name: 'Switch to light theme' }),
    ).toBeTruthy()
  })
})
