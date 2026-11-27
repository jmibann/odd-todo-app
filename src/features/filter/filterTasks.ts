import type { Task } from '../todo/useTasks.ts'

/**
 * Pure filtering predicate (odd/tasks/filter-search.md S1-S3, S5).
 * S1: "Matching is a case-insensitive substring match on the trimmed query.
 * An empty query matches everything." S2: status 'all' | 'active' |
 * 'completed'. S5: returns a new array in input order — never mutates,
 * never reorders, never touches storage.
 */

export type StatusFilter = 'all' | 'active' | 'completed'

export type FilterCriteria = { q: string; status: StatusFilter }

export function matchesQuery(task: Task, q: string): boolean {
  const query = q.trim().toLowerCase()
  if (query === '') return true
  return task.text.toLowerCase().includes(query)
}

export function matchesStatus(task: Task, status: StatusFilter): boolean {
  switch (status) {
    case 'active':
      return !task.completed
    case 'completed':
      return task.completed
    case 'all':
      return true
  }
}

export function filterTasks(tasks: Task[], criteria: FilterCriteria): Task[] {
  return tasks.filter(
    (task) =>
      matchesQuery(task, criteria.q) && matchesStatus(task, criteria.status),
  )
}
