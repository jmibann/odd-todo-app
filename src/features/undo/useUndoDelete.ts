import { useCallback, useEffect, useState } from 'react'
import type { DeletedTask } from './deletedTask.ts'
import type { Task } from '../todo/useTasks.ts'

/**
 * Pending-deletion controller for undo (odd/tasks/undo-delete.md S6, S8, S9).
 * Owns the in-memory latest-only state: reportDeleted replaces any earlier
 * pending deletion (the previous one becomes final), and the message
 * auto-dismisses after UNDO_TIMEOUT_MS. Nothing here touches storage: the
 * deletion is already persisted by useTasks.removeTask (S9); only the undo
 * action itself writes, through the restore callback.
 */
export const UNDO_TIMEOUT_MS = 5000

export function useUndoDelete(
  restore: (task: Task, index: number) => void,
): {
  pending: DeletedTask | null
  reportDeleted: (deleted: DeletedTask) => void
  undo: () => void
} {
  const [pending, setPending] = useState<DeletedTask | null>(null)

  // Dismissal timer: restarts on every new pending deletion because the
  // entry object identity changes when one delete replaces another.
  useEffect(() => {
    if (pending === null) return
    const timer = setTimeout(() => setPending(null), UNDO_TIMEOUT_MS)
    return () => clearTimeout(timer)
  }, [pending])

  const reportDeleted = useCallback((deleted: DeletedTask) => {
    setPending(deleted)
  }, [])

  // Reads pending from render state, so the undo handler is always fresh
  // for the button that App renders from this hook's return value.
  const undo = useCallback(() => {
    if (pending === null) return
    restore(pending.task, pending.index)
    setPending(null)
  }, [pending, restore])

  return { pending, reportDeleted, undo }
}
