import { FilterStatus } from './FilterStatus.tsx'
import { TaskFilters } from './TaskFilters.tsx'
import { TaskList } from '../todo/TaskList.tsx'
import { useTaskFilter } from './useTaskFilter.ts'
import type { Task } from '../todo/useTasks.ts'

/**
 * Composition (odd/tasks/filter-search.md T5): controls + URL state + the
 * visible slice of the list. Drop-in for TaskList in App: same props,
 * plus filtering. "No tasks match." is decided here (S3) so it can never
 * render together with the list's own "No tasks yet." — with no tasks the
 * query never empties the list further, so TaskList keeps its message.
 */

type TaskFilterProps = {
  tasks: Task[]
  onToggle: (id: string) => void
  onRemove: (id: string) => void
}

export function TaskFilter({ tasks, onToggle, onRemove }: TaskFilterProps) {
  const { q, status, setQ, setStatus, visible } = useTaskFilter(tasks)
  const noMatches = tasks.length > 0 && visible.length === 0
  return (
    <>
      <TaskFilters
        q={q}
        status={status}
        onQChange={setQ}
        onStatusChange={setStatus}
      />
      {noMatches ? (
        <FilterStatus />
      ) : (
        <TaskList tasks={visible} onToggle={onToggle} onRemove={onRemove} />
      )}
    </>
  )
}
