import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useTasks } from './useTasks.ts'

const FULL_KEY = ['odd-todo-app', 'tasks'].join(':')

function Host() {
  const { tasks, addTask, toggleTask, removeTask, replaceTasks } = useTasks()
  return (
    <>
      <ul>
        {tasks.map((task) => (
          <li key={task.id}>
            <span>{task.completed ? `[x] ${task.text}` : task.text}</span>
            <button type="button" onClick={() => toggleTask(task.id)}>
              {`toggle:${task.id}`}
            </button>
            <button type="button" onClick={() => removeTask(task.id)}>
              {`remove:${task.id}`}
            </button>
          </li>
        ))}
      </ul>
      <button type="button" onClick={() => addTask('Buy milk')}>
        add
      </button>
      <button type="button" onClick={() => addTask('Pay rent')}>
        add second
      </button>
      <button
        type="button"
        onClick={() =>
          replaceTasks([
            { id: 'imp-1', text: 'Imported', completed: true },
            { id: 'imp-2', text: 'Also imported', completed: false },
          ])
        }
      >
        replace
      </button>
    </>
  )
}

function seed(raw: string) {
  window.localStorage.setItem(FULL_KEY, raw)
}

function stored(): string | null {
  return window.localStorage.getItem(FULL_KEY)
}

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(cleanup)

describe('useTasks', () => {
  it('shows stored tasks in stored order with completed state', () => {
    seed(
      JSON.stringify([
        { id: 'b', text: 'Newer task', completed: false },
        { id: 'a', text: 'Older task', completed: true },
      ]),
    )
    render(<Host />)
    const items = screen.getByRole('list').children
    expect(items[0]?.textContent).toContain('Newer task')
    expect(items[1]?.textContent).toContain('[x] Older task')
  })

  it('starts with an empty list when nothing is stored', () => {
    render(<Host />)
    expect(screen.getByRole('list').children).toHaveLength(0)
  })

  it('shows an empty list for an invalid stored value and does not overwrite it', () => {
    seed('{not json')
    render(<Host />)
    expect(screen.getByRole('list').children).toHaveLength(0)
    expect(stored()).toBe('{not json')

    // a wrong-shape entry (array element missing fields) is rejected whole
    cleanup()
    seed(JSON.stringify([{ id: 'a', text: 'ok' }]))
    render(<Host />)
    expect(screen.getByRole('list').children).toHaveLength(0)
    expect(stored()).toBe(JSON.stringify([{ id: 'a', text: 'ok' }]))

    // only a user mutation writes, and then the value is a valid array
    fireEvent.click(screen.getByRole('button', { name: 'add' }))
    expect(stored()).toContain('Buy milk')
  })

  it('does not write on mount when the stored value is valid', () => {
    const raw = JSON.stringify([
      { id: 'a', text: 'Persisted', completed: true },
    ])
    seed(raw)
    render(<Host />)
    cleanup()
    expect(stored()).toBe(raw)
  })

  it('persists add, toggle and delete (state and order) across remounts', () => {
    const first = render(<Host />)
    fireEvent.click(screen.getByRole('button', { name: 'add' }))
    expect(screen.getByRole('list').textContent).toContain('Buy milk')

    fireEvent.click(screen.getByRole('button', { name: /^toggle:/ }))
    expect(screen.getByRole('list').textContent).toContain('[x] Buy milk')

    // unchecking restores it (S3)
    fireEvent.click(screen.getByRole('button', { name: /^toggle:/ }))
    expect(screen.getByRole('list').textContent).toContain('Buy milk')
    expect(stored()).toContain('"completed":false')
    expect(screen.getByRole('list').textContent).not.toContain('[x] Buy milk')
    fireEvent.click(screen.getByRole('button', { name: /^toggle:/ }))
    expect(screen.getByRole('list').textContent).toContain('[x] Buy milk')
    first.unmount()

    // reload with the stored value: completed state survived
    const storedBeforeDelete = stored()
    expect(storedBeforeDelete).toContain('"completed":true')
    const second = render(<Host />)
    expect(screen.getByRole('list').textContent).toContain('[x] Buy milk')

    fireEvent.click(screen.getByRole('button', { name: /^remove:/ }))
    expect(screen.getByRole('list').children).toHaveLength(0)
    expect(stored()).toBe('[]')
    second.unmount()
    expect(stored()).toBe('[]')
  })

  it('applies two updates issued in the same tick (stale-closure guard)', () => {
    render(<Host />)
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'add' }))
      fireEvent.click(screen.getByRole('button', { name: 'add second' }))
    })
    const texts = [...screen.getByRole('list').children].map(
      (li) => li.querySelector('span')?.textContent,
    )
    expect(texts).toEqual(['Pay rent', 'Buy milk'])
    const storedTasks = JSON.parse(stored() ?? '[]')
    expect(storedTasks).toHaveLength(2)
    expect(storedTasks[0]?.text).toBe('Pay rent')
  })
})

// undo-delete.md S7 (restore at original position) and S9 (the deletion is
// persisted immediately, before any undo). Additive host only: the Host above
// stays untouched.
describe('useTasks restoreTask (undo-delete S7, S9)', () => {
  const taskB = { id: 'b', text: 'Task B', completed: true }

  function RestoreHost() {
    const { tasks, removeTask, restoreTask } = useTasks()
    return (
      <>
        <ul>
          {tasks.map((task) => (
            <li key={task.id}>
              <span>{task.completed ? `[x] ${task.text}` : task.text}</span>
              <button type="button" onClick={() => removeTask(task.id)}>
                {`remove:${task.id}`}
              </button>
            </li>
          ))}
        </ul>
        <button type="button" onClick={() => restoreTask(taskB, 1)}>
          restore b at 1
        </button>
        <button type="button" onClick={() => restoreTask(taskB, 9)}>
          restore b at 9
        </button>
      </>
    )
  }

  function storedIds(): string[] {
    return (JSON.parse(stored() ?? '[]') as { id: string }[]).map(
      (task) => task.id,
    )
  }

  it('persists the delete immediately and restores the task at its index across remount', () => {
    const seedRaw = JSON.stringify([
      { id: 'a', text: 'Task A', completed: false },
      taskB,
      { id: 'c', text: 'Task C', completed: false },
    ])
    seed(seedRaw)
    const first = render(<RestoreHost />)

    fireEvent.click(screen.getByRole('button', { name: 'remove:b' }))
    // S9: the raw stored JSON lacks the task before any undo or timeout.
    expect(storedIds()).toEqual(['a', 'c'])

    fireEvent.click(screen.getByRole('button', { name: 'restore b at 1' }))
    // same order, ids and identity (text and completed state) as before
    expect(storedIds()).toEqual(['a', 'b', 'c'])
    expect(stored()).toBe(seedRaw)

    // the restore is persisted, not just in memory
    first.unmount()
    render(<RestoreHost />)
    const afterReload = [...screen.getByRole('list').children].map(
      (li) => li.querySelector('span')?.textContent,
    )
    expect(afterReload).toEqual(['Task A', '[x] Task B', 'Task C'])
  })

  it('clamps an out-of-range index to the end of the list', () => {
    seed(
      JSON.stringify([{ id: 'a', text: 'Task A', completed: false }]),
    )
    render(<RestoreHost />)
    fireEvent.click(screen.getByRole('button', { name: 'restore b at 9' }))
    expect(storedIds()).toEqual(['a', 'b'])
    const texts = [...screen.getByRole('list').children].map(
      (li) => li.querySelector('span')?.textContent,
    )
    expect(texts).toEqual(['Task A', '[x] Task B'])
  })
})

describe('useTasks replaceTasks (backup S4)', () => {
  it('swaps the whole list, persists, and survives remount', () => {
    window.localStorage.clear()
    render(<Host />)
    fireEvent.click(screen.getByRole('button', { name: 'add' }))
    fireEvent.click(screen.getByRole('button', { name: 'replace' }))
    expect(screen.getByRole('list').textContent).toContain('Imported')
    expect(screen.getByRole('list').textContent).not.toContain('Buy milk')
    const raw = stored()
    expect(raw).toContain('"completed":true')
    cleanup()

    render(<Host />)
    const texts = [...screen.getByRole('list').children].map(
      (li) => li.querySelector('span')?.textContent,
    )
    expect(texts).toEqual(['[x] Imported', 'Also imported'])
  })
})
