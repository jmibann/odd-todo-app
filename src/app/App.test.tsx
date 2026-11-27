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

const FULL_KEY = ['odd-todo-app', 'tasks'].join(':')

function addTaskViaUi(text: string) {
  const input = screen.getByRole('textbox', { name: 'New task' })
  fireEvent.change(input, { target: { value: text } })
  fireEvent.click(screen.getByRole('button', { name: 'Add' }))
}

describe('integration: filter + undo in App (filter-search S5, undo-delete S10-seam)', () => {
  it('filtering changes only the view, never storage (S5)', () => {
    stubMatchMedia(false)
    render(<App />)
    addTaskViaUi('Buy milk')
    addTaskViaUi('Pay rent')
    const before = window.localStorage.getItem(FULL_KEY)

    fireEvent.change(screen.getByRole('textbox', { name: 'Search tasks' }), {
      target: { value: 'milk' },
    })
    expect(screen.getByRole('list').textContent).toContain('Buy milk')
    expect(screen.getByRole('list').textContent).not.toContain('Pay rent')

    // stored bytes and order untouched by filtering
    expect(window.localStorage.getItem(FULL_KEY)).toBe(before)
  })

  it('undo restores into the full list; an active filter keeps it hidden (req 10)', () => {
    stubMatchMedia(false)
    render(<App />)
    addTaskViaUi('Buy milk')
    addTaskViaUi('Pay rent')

    fireEvent.click(screen.getByRole('button', { name: 'Delete Buy milk' }))
    expect(screen.getByText('Task deleted.')).toBeTruthy()

    // activate a filter that excludes the deleted task, then undo
    fireEvent.change(screen.getByRole('textbox', { name: 'Search tasks' }), {
      target: { value: 'rent' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }))

    // restored into the full list (storage) but hidden by the active filter
    expect(window.localStorage.getItem(FULL_KEY)).toContain('Buy milk')
    expect(screen.getByRole('list').textContent).not.toContain('Buy milk')

    // clearing the query reveals it at its original position (after Pay rent)
    fireEvent.change(screen.getByRole('textbox', { name: 'Search tasks' }), {
      target: { value: '' },
    })
    const rows = [...screen.getByRole('list').children].map(
      (li) => li.querySelector('label')?.textContent,
    )
    expect(rows).toEqual(['Pay rent', 'Buy milk'])
    expect(screen.queryByText('Task deleted.')).toBeNull()
  })

  it('deletion persists immediately and the undo state is in-memory only (S9)', () => {
    stubMatchMedia(false)
    const first = render(<App />)
    addTaskViaUi('Buy milk')
    fireEvent.click(screen.getByRole('button', { name: 'Delete Buy milk' }))
    expect(window.localStorage.getItem(FULL_KEY)).toBe('[]')

    // reload during the 5 s window: deleted, no message
    first.unmount()
    stubMatchMedia(false)
    render(<App />)
    expect(screen.queryByText('Task deleted.')).toBeNull()
    expect(window.localStorage.getItem(FULL_KEY)).toBe('[]')
  })
})
