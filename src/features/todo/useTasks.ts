import { useCallback, useState } from 'react'
import { loadItem, saveItem } from '../../shared/storage.ts'

/**
 * Task list state (odd/tasks/todo-core.md S5): persisted through
 * storage.ts only, under the approved shape — an array in display order
 * (newest first) of { id, text, completed }. A missing or invalid stored
 * value shows an empty list and is NOT overwritten until the user mutates.
 */

export type Task = { id: string; text: string; completed: boolean }

const TASKS_KEY = 'tasks'

function isTask(value: unknown): value is Task {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false
  }
  const record = value as Record<string, unknown>
  if (Object.keys(record).length !== 3) return false
  return (
    typeof record.id === 'string' &&
    typeof record.text === 'string' &&
    typeof record.completed === 'boolean'
  )
}

function isTaskList(value: unknown): value is Task[] {
  return Array.isArray(value) && value.every(isTask)
}

function loadTasks(): Task[] {
  const value = loadItem<unknown>(TASKS_KEY, [])
  return isTaskList(value) ? value : []
}

export function useTasks(): {
  tasks: Task[]
  addTask: (text: string) => void
  toggleTask: (id: string) => void
  removeTask: (id: string) => void
} {
  const [tasks, setTasks] = useState<Task[]>(loadTasks)

  // All mutations run through setTasks' updater so that several updates
  // issued in the same tick compose instead of clobbering each other with
  // a stale render-time snapshot. saveItem inside the updater is idempotent:
  // in StrictMode the updater may run twice with the same prev, and both
  // runs compute and persist the same next value.
  const commit = useCallback(
    (updater: (previous: Task[]) => Task[]) => {
      setTasks((previous) => {
        const next = updater(previous)
        saveItem(TASKS_KEY, next)
        return next
      })
    },
    [],
  )

  const addTask = useCallback(
    (text: string) => {
      commit((previous) => [
        { id: crypto.randomUUID(), text, completed: false },
        ...previous,
      ])
    },
    [commit],
  )

  const toggleTask = useCallback(
    (id: string) => {
      commit((previous) =>
        previous.map((task) =>
          task.id === id ? { ...task, completed: !task.completed } : task,
        ),
      )
    },
    [commit],
  )

  const removeTask = useCallback(
    (id: string) => {
      commit((previous) => previous.filter((task) => task.id !== id))
    },
    [commit],
  )

  return { tasks, addTask, toggleTask, removeTask }
}
