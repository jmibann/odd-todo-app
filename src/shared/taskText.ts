/**
 * Task-text rules (todo-core S1), shared by the add form and backup import
 * (odd/tasks/backup.md S3: "any task that breaks the todo-core S1 rules").
 * Both consumers must accept exactly the same texts.
 */

export const MAX_TASK_LENGTH = 120

export function isTaskTextEmpty(text: string): boolean {
  return text.trim() === ''
}

export function isTaskTextTooLong(text: string): boolean {
  return text.trim().length > MAX_TASK_LENGTH
}
