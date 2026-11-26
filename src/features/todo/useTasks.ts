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

  const commit = useCallback((next: Task[]) => {
    setTasks(next)
    saveItem(TASKS_KEY, next)
  }, [])

  const addTask = useCallback(
    (text: string) => {
      commit([
        { id: crypto.randomUUID(), text, completed: false },
        ...tasks,
      ])
    },
    [commit, tasks],
  )

  const toggleTask = useCallback(
    (id: string) => {
      commit(
        tasks.map((task) =>
          task.id === id ? { ...task, completed: !task.completed } : task,
        ),
      )
    },
    [commit, tasks],
  )

  const removeTask = useCallback(
    (id: string) => {
      commit(tasks.filter((task) => task.id !== id))
    },
    [commit, tasks],
  )

  return { tasks, addTask, toggleTask, removeTask }
}
