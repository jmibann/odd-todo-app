import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useTheme } from './useTheme.ts'
import { loadItem } from '../storage.ts'

function Host() {
  const { theme, toggleTheme } = useTheme()
  return <button type="button" onClick={toggleTheme}>{`theme: ${theme}`}</button>
}

type Listener = (event: { matches: boolean }) => void

function stubMatchMedia(initialDark: boolean) {
  const listeners: Listener[] = []
  const mq = {
    matches: initialDark,
    addEventListener: (_: string, cb: Listener) => listeners.push(cb),
    removeEventListener: (_: string, cb: Listener) => {
      const i = listeners.indexOf(cb)
      if (i >= 0) listeners.splice(i, 1)
    },
  }
  const changeSystemTheme = (dark: boolean) => {
    mq.matches = dark
    listeners.forEach((cb) => cb({ matches: dark }))
  }
  window.matchMedia = vi.fn().mockImplementation(() => mq)
  return { changeSystemTheme }
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

describe('useTheme', () => {
  it('follows the OS live until the user overrides, then the stored choice wins', () => {
    const { changeSystemTheme } = stubMatchMedia(false)
    render(<Host />)
    expect(document.documentElement.dataset.theme).toBe('light')

    // no override yet: live OS changes apply
    act(() => changeSystemTheme(true))
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(loadItem<string | null>('theme', null)).toBeNull()

    // reload keeps following the (now dark) OS
    cleanup()
    render(<Host />)
    expect(screen.getByRole('button', { name: 'theme: dark' })).toBeTruthy()

    // user overrides to light while the OS is dark
    fireEvent.click(screen.getByRole('button', { name: 'theme: dark' }))
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(loadItem<string | null>('theme', null)).toBe('light')

    // override wins over the OS
    act(() => changeSystemTheme(false))
    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('treats a stored value other than light/dark as no stored preference', () => {
    // seed a corrupt entry the way broken storage would present it
    window.localStorage.setItem('odd-todo-app:theme', '"bogus"')
    stubMatchMedia(false)
    render(<Host />)

    // follows the OS instead, and the corrupt entry is not rewritten
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(
      window.localStorage.getItem('odd-todo-app:theme'),
    ).toBe('"bogus"')

    // only a user toggle overwrites it, with a valid value
    fireEvent.click(screen.getByRole('button', { name: 'theme: light' }))
    expect(
      window.localStorage.getItem('odd-todo-app:theme'),
    ).toBe('"dark"')
    expect(document.documentElement.dataset.theme).toBe('dark')

    // reload: the healed stored choice wins over the OS
    cleanup()
    render(<Host />)
    expect(document.documentElement.dataset.theme).toBe('dark')
  })
})
