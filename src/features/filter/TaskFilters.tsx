import styles from './TaskFilters.module.css'
import type { StatusFilter } from './filterTasks.ts'

/**
 * Filter controls (odd/tasks/filter-search.md S1, S2). All user-facing
 * strings are the user's own words, verbatim. Fully controlled: the
 * parent (useTaskFilter) owns the state and its URL sync.
 */

type TaskFiltersProps = {
  q: string
  status: StatusFilter
  onQChange: (q: string) => void
  onStatusChange: (status: StatusFilter) => void
}

export function TaskFilters({
  q,
  status,
  onQChange,
  onStatusChange,
}: TaskFiltersProps) {
  return (
    <div className={styles.filters}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="task-search">
          Search tasks
        </label>
        <input
          id="task-search"
          className={styles.input}
          type="text"
          value={q}
          onChange={(event) => onQChange(event.target.value)}
        />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="task-status">
          Show
        </label>
        <select
          id="task-status"
          className={styles.select}
          value={status}
          onChange={(event) =>
            onStatusChange(event.target.value as StatusFilter)
          }
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
        </select>
      </div>
    </div>
  )
}
