import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useTasks } from '../todo/useTasks.ts'
import type { Task } from '../todo/useTasks.ts'
import { captureDeleted } from './deletedTask.ts'
import { UNDO_TIMEOUT_MS, useUndoDelete } from './useUndoDelete.ts'
import { UndoDelete } from './UndoDelete.tsx'

const FULL_KEY = ['odd-todo-app', 'tasks'].join(':')

// A host wired exactly the way App will be (undo-delete.md T6): delete goes
// through useTasks, captureDeleted records {task, index} before it runs,
// useUndoDelete owns the in-memory pending state, UndoDelete renders it.
function Host() {
  const { tasks, removeTask, restoreTask } = useTasks()
  const { pending, reportDeleted, undo } = useUndoDelete(restoreTask)
  return (
    <>
      <ul>
        {tasks.map((task) => (
          <li key={task.id}>
            <span>{task.completed ? `[x] ${task.text}` : task.text}</span>
            <button
              type="button"
              onClick={() => {
                const deleted = captureDeleted(tasks, task.id)
                removeTask(task.id)
                if (deleted !== null) reportDeleted(deleted)
              }}
            >
              {`remove:${task.id}`}
            </button>
          </li>
        ))}
      </ul>
      <UndoDelete pending={pending} onUndo={undo} />
    </>
  )
}

const base: Task[] = [
  { id: 'a', text: 'Task A', completed: false },
  { id: 'b', text: 'Task B', completed: true },
  { id: 'c', text: 'Task C', completed: false },
]

function seed(tasks: Task[]) {
  window.localStorage.setItem(FULL_KEY, JSON.stringify(tasks))
}

function texts(): string[] {
  return [...screen.getByRole('list').children].map(
    (li) => li.querySelector('span')?.textContent ?? '',
  )
}

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms)
  })
}

function message(): string | null {
  return screen.queryByText('Task deleted.')?.textContent ?? null
}

beforeEach(() => {
  window.localStorage.clear()
  vi.useFakeTimers()
  seed(base)
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('UndoDelete message (S6)', () => {
  it('shows "Task deleted." with an Undo button inside a status region', () => {
    render(<Host />)
    // the live region is pre-rendered so assistants announce its content
    expect(screen.getByRole('status').textContent).toBe('')

    fireEvent.click(screen.getByRole('button', { name: 'remove:b' }))
    const status = screen.getByRole('status')
    expect(message()).toBe('Task deleted.')
    expect(within(status).getByText('Task deleted.')).toBeDefined()
    expect(within(status).getByRole('button', { name: 'Undo' })).toBeDefined()
  })

  it('is visible through 4999 ms and auto-dismisses at 5000 ms', () => {
    render(<Host />)
    fireEvent.click(screen.getByRole('button', { name: 'remove:b' }))

    advance(UNDO_TIMEOUT_MS - 1)
    expect(message()).toBe('Task deleted.')
    advance(1)
    expect(message()).toBeNull()
    expect(screen.getByRole('status').textContent).toBe('')
  })
})

describe('UndoDelete restore (S7)', () => {
  it('Undo restores the same task at its index, dismisses, and persists', () => {
    const first = render(<Host />)
    fireEvent.click(screen.getByRole('button', { name: 'remove:b' }))
    expect(texts()).toEqual(['Task A', 'Task C'])

    fireEvent.click(screen.getByRole('button', { name: 'Undo' }))
    expect(texts()).toEqual(['Task A', '[x] Task B', 'Task C'])
    expect(message()).toBeNull()

    // the restore went through the persistence path: a reload shows it
    first.unmount()
    render(<Host />)
    expect(texts()).toEqual(['Task A', '[x] Task B', 'Task C'])
  })
})

describe('UndoDelete latest-only (S8)', () => {
  it('a second delete replaces the pending one; the first becomes final', () => {
    render(<Host />)
    fireEvent.click(screen.getByRole('button', { name: 'remove:b' }))
    // list is now [a, c]; deleting c records index 1 and replaces the message
    fireEvent.click(screen.getByRole('button', { name: 'remove:c' }))
    expect(message()).toBe('Task deleted.')

    // the replacement restarts the 5 s window
    advance(UNDO_TIMEOUT_MS - 1)
    expect(message()).toBe('Task deleted.')

    fireEvent.click(screen.getByRole('button', { name: 'Undo' }))
    // only the latest deletion was undoable: b stays deleted, c is back
    expect(texts()).toEqual(['Task A', 'Task C'])
    expect(message()).toBeNull()
  })
})

describe('UndoDelete immediate persistence (S9)', () => {
  it('persists the delete before any undo or timeout and adds no storage keys', () => {
    render(<Host />)
    fireEvent.click(screen.getByRole('button', { name: 'remove:b' }))

    // raw stored JSON lacks the task while the message is still up
    const stored = JSON.parse(
      window.localStorage.getItem(FULL_KEY) ?? '[]',
    ) as Task[]
    expect(stored.map((t) => t.id)).toEqual(['a', 'c'])

    // undo state is memory-only: no new storage keys
    expect(Object.keys(window.localStorage)).toEqual([FULL_KEY])

    // letting the window expire keeps the deletion final
    advance(UNDO_TIMEOUT_MS)
    const finalStored = JSON.parse(
      window.localStorage.getItem(FULL_KEY) ?? '[]',
    ) as Task[]
    expect(finalStored.map((t) => t.id)).toEqual(['a', 'c'])
  })

  it('unmount and remount (a reload) during the window shows no message', () => {
    const first = render(<Host />)
    fireEvent.click(screen.getByRole('button', { name: 'remove:b' }))
    first.unmount()
    render(<Host />)
    expect(message()).toBeNull()
  })
})
