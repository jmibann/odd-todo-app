import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TaskFilter } from './TaskFilter.tsx'
import type { Task } from '../todo/useTasks.ts'

const tasks: Task[] = [
  { id: '3', text: 'Buy milk', completed: false },
  { id: '2', text: 'Buy bread', completed: true },
  { id: '1', text: 'Pay rent', completed: false },
]

function setup(overrides: { tasks?: Task[] } = {}) {
  const props = {
    tasks: overrides.tasks ?? tasks,
    onToggle: vi.fn(),
    onRemove: vi.fn(),
  }
  render(<TaskFilter {...props} />)
  return props
}

const search = () => screen.getByRole('textbox', { name: 'Search tasks' })
const show = () => screen.getByRole('combobox', { name: 'Show' })
// Row identity through each item's accessible delete-button name, in DOM
// order (TaskItem renders a "Delete <task text>" aria-label).
const rows = () =>
  screen
    .getAllByRole('button')
    .map((button) => button.getAttribute('aria-label') ?? '')
    .filter((name) => name.startsWith('Delete '))
    .map((name) => name.slice('Delete '.length))

beforeEach(() => {
  window.history.replaceState(null, '', '/')
  window.localStorage.clear()
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('TaskFilter (S1-S3)', () => {
  it('renders the controls above the full list, in order, with defaults', () => {
    setup()
    expect(search()).toBeTruthy()
    expect((show() as HTMLSelectElement).value).toBe('all')
    expect(rows()).toEqual(['Buy milk', 'Buy bread', 'Pay rent'])
  })

  // S3: "Search and status combine."
  it('combines search and status', () => {
    setup()
    fireEvent.change(search(), { target: { value: 'buy' } })
    expect(rows()).toEqual(['Buy milk', 'Buy bread'])
    fireEvent.change(show(), { target: { value: 'active' } })
    expect(rows()).toEqual(['Buy milk'])
    fireEvent.change(show(), { target: { value: 'completed' } })
    expect(rows()).toEqual(['Buy bread'])
  })

  // S3: "When there are tasks but none match, show \"No tasks match.\"."
  it('shows "No tasks match." when tasks exist but none match', () => {
    setup()
    fireEvent.change(search(), { target: { value: 'zzz' } })
    expect(screen.getByText('No tasks match.')).toBeTruthy()
    expect(screen.queryByText('No tasks yet.')).toBeNull()
    expect(screen.queryByRole('list')).toBeNull()
  })

  // S3: "When there are no tasks at all, keep showing \"No tasks yet.\"."
  it('shows "No tasks yet." (never both messages) when the list is empty', () => {
    setup({ tasks: [] })
    expect(screen.getByText('No tasks yet.')).toBeTruthy()
    expect(screen.queryByText('No tasks match.')).toBeNull()
    fireEvent.change(search(), { target: { value: 'zzz' } })
    expect(screen.getByText('No tasks yet.')).toBeTruthy()
    expect(screen.queryByText('No tasks match.')).toBeNull()
  })

  it('restores the same view from a shared link', () => {
    window.history.replaceState(null, '', '/?q=buy&status=completed')
    setup()
    expect((search() as HTMLInputElement).value).toBe('buy')
    expect((show() as HTMLSelectElement).value).toBe('completed')
    expect(rows()).toEqual(['Buy bread'])
  })
})

describe('TaskFilter (S4, S5)', () => {
  it('typing updates the URL by replacing the entry, never pushing', () => {
    const push = vi.spyOn(window.history, 'pushState')
    const replace = vi.spyOn(window.history, 'replaceState')
    setup()
    fireEvent.change(search(), { target: { value: 'milk' } })
    fireEvent.change(show(), { target: { value: 'active' } })
    expect(push).not.toHaveBeenCalled()
    expect(replace).toHaveBeenCalled()
    expect(window.location.search).toBe('?q=milk&status=active')
  })

  // S5: "Filters only change what is shown, never what is stored or its
  // order." — deletion still targets the right id through the filter, and
  // storage and the input array are untouched by filtering itself.
  it('is view-only: storage and input array survive filtering unchanged', () => {
    window.localStorage.setItem('tasks', JSON.stringify(tasks))
    const storedBefore = window.localStorage.getItem('tasks')
    const snapshot = structuredClone(tasks)
    const { onRemove } = setup()
    fireEvent.change(search(), { target: { value: 'buy' } })
    fireEvent.change(show(), { target: { value: 'completed' } })
    fireEvent.click(screen.getByRole('button', { name: 'Delete Buy bread' }))
    expect(onRemove).toHaveBeenCalledWith('2')
    expect(window.localStorage.getItem('tasks')).toBe(storedBefore)
    expect(tasks).toEqual(snapshot)
    expect(rows()).toEqual(['Buy bread'])
  })
})
