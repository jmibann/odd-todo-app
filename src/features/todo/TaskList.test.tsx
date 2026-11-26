import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TaskList } from './TaskList.tsx'
import type { Task } from './useTasks.ts'

const tasks: Task[] = [
  { id: 'b', text: 'Buy milk', completed: false },
  { id: 'a', text: 'Pay rent', completed: true },
]

function setup(overrides: Partial<Parameters<typeof TaskList>[0]> = {}) {
  const props = {
    tasks,
    onToggle: vi.fn(),
    onRemove: vi.fn(),
    ...overrides,
  }
  render(<TaskList {...props} />)
  return props
}

afterEach(cleanup)

describe('TaskList (S2)', () => {
  it('shows "No tasks yet." when there are no tasks', () => {
    setup({ tasks: [] })
    expect(screen.getByText('No tasks yet.')).toBeTruthy()
    expect(screen.queryByRole('list')).toBeNull()
  })

  it('renders tasks as a list in given order (newest first)', () => {
    setup()
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(2)
    expect(items[0]?.textContent).toContain('Buy milk')
    expect(items[1]?.textContent).toContain('Pay rent')
  })
})

describe('TaskItem complete and delete (S3, S4)', () => {
  it('each task has a checkbox named by the task text, reflecting state', () => {
    setup()
    const checkbox = screen.getByRole('checkbox', { name: 'Buy milk' })
    expect((checkbox as HTMLInputElement).checked).toBe(false)
    expect(
      (screen.getByRole('checkbox', { name: 'Pay rent' }) as HTMLInputElement)
        .checked,
    ).toBe(true)
  })

  it('checking a task calls onToggle with its id', () => {
    const { onToggle } = setup()
    fireEvent.click(screen.getByRole('checkbox', { name: 'Buy milk' }))
    expect(onToggle).toHaveBeenCalledWith('b')
  })

  it('completed tasks carry the completed style, pending tasks do not', () => {
    setup()
    const done = screen
      .getByRole('checkbox', { name: 'Pay rent' })
      .closest('li') as HTMLElement
    const pending = screen
      .getByRole('checkbox', { name: 'Buy milk' })
      .closest('li') as HTMLElement
    expect(done.className).toContain('completed')
    expect(pending.className).not.toContain('completed')
  })

  it('deletes immediately via a button named "Delete <task text>"', () => {
    const { onRemove } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Delete Buy milk' }))
    expect(onRemove).toHaveBeenCalledWith('b')
  })
})
