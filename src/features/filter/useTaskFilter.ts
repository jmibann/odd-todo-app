import { useMemo } from 'react'
import { filterTasks } from './filterTasks.ts'
import type { StatusFilter } from './filterTasks.ts'
import { useTaskUrlFilter } from './useTaskUrlFilter.ts'
import type { Task } from '../todo/useTasks.ts'

/**
 * Public entry point for App integration (odd/tasks/filter-search.md
 * T5): filter state synced with the URL plus the visible derivation of a
 * task list. S5: a pure view over `tasks` — never mutates, reorders or
 * persists anything.
 */
export type TaskFilterState = {
  q: string
  status: StatusFilter
  setQ: (q: string) => void
  setStatus: (status: StatusFilter) => void
  visible: Task[]
}

export function useTaskFilter(tasks: Task[]): TaskFilterState {
  const { q, status, setQ, setStatus } = useTaskUrlFilter()
  const visible = useMemo(
    () => filterTasks(tasks, { q, status }),
    [tasks, q, status],
  )
  return { q, status, setQ, setStatus, visible }
}
