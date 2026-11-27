import type { Task } from '../todo/useTasks.ts'

/**
 * One pending deletion (odd/tasks/undo-delete.md S7): the removed task and
 * the index it occupied in the full ordered list. The caller captures this
 * from the current tasks BEFORE calling removeTask, then hands it to
 * useUndoDelete.reportDeleted. Read-only helper: persistence stays entirely
 * in useTasks.
 */
export type DeletedTask = { task: Task; index: number }

export function captureDeleted(
  tasks: Task[],
  id: string,
): DeletedTask | null {
  for (const [index, task] of tasks.entries()) {
    if (task.id === id) return { task, index }
  }
  return null
}
