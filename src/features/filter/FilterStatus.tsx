import styles from './FilterStatus.module.css'

/**
 * Empty-result message (odd/tasks/filter-search.md S3): "When there are
 * tasks but none match, show \"No tasks match.\"." Purely presentational —
 * the caller (TaskFilter) decides visibility, so that it can never render
 * together with the list's own "No tasks yet." state.
 */
export function FilterStatus() {
  return <p className={styles.status}>No tasks match.</p>
}
