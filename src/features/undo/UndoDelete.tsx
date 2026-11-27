import styles from './UndoDelete.module.css'
import type { DeletedTask } from './deletedTask.ts'

type UndoDeleteProps = {
  pending: DeletedTask | null
  onUndo: () => void
}

/**
 * Undo snackbar (odd/tasks/undo-delete.md S6, S7). The role="status" region
 * is always in the DOM — live regions are only announced reliably when they
 * pre-exist the message — and carries the message and its Undo button while
 * a deletion is pending. Timer and latest-only state live in useUndoDelete.
 */
export function UndoDelete({ pending, onUndo }: UndoDeleteProps) {
  return (
    <div role="status" className={styles.region}>
      {pending !== null && (
        <div className={styles.snackbar}>
          <p className={styles.message}>Task deleted.</p>
          <button
            type="button"
            className={styles.undoButton}
            onClick={onUndo}
          >
            Undo
          </button>
        </div>
      )}
    </div>
  )
}
