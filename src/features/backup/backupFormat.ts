import { isTaskTextEmpty, isTaskTextTooLong } from '../../shared/taskText.ts'
import type { Task } from '../todo/useTasks.ts'

/**
 * Backup file contract (odd/tasks/backup.md S5, approved in L2).
 * The tasks array IS the stored shape (todo-core S5): same elements, array
 * order = display order. Files are untrusted input (S6): every value is
 * validated, unknown fields are dropped, task ids are regenerated, and task
 * text is kept exactly as written when it passes the shared S1 rules.
 */

export const BACKUP_FORMAT = 'odd-todo-app/backup'
export const BACKUP_VERSION = 1
export const MAX_BACKUP_BYTES = 1024 * 1024

/*
 * exportedAt must be an ISO 8601 INSTANT: date, time and an explicit
 * timezone (Z or ±HH:MM) — matching what serializeBackup writes via
 * Date#toISOString and any offset-equivalent instant a user hand-edits.
 * Date-only or timezone-less strings are ambiguous, so they are rejected.
 */
const ISO_INSTANT =
  /^\d{4}-\d{2}-\d{2}[Tt]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:[Zz]|[+-]\d{2}:\d{2})$/

function isIsoInstant(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    ISO_INSTANT.test(value) &&
    !Number.isNaN(Date.parse(value))
  )
}

function pad(value: number, size: number): string {
  return String(value).padStart(size, '0')
}

export function backupFileName(now: Date): string {
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1, 2)}-${pad(
    now.getDate(),
    2,
  )}`
  return `odd-todo-backup-${date}.json`
}

export function serializeBackup(tasks: Task[], now: Date): string {
  return JSON.stringify(
    {
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      exportedAt: now.toISOString(),
      tasks,
    },
    null,
    2,
  )
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isBackupTaskElement(value: unknown): value is {
  text: string
  completed: boolean
} {
  if (!isPlainObject(value)) return false
  if (typeof value.id !== 'string') return false
  if (typeof value.text !== 'string') return false
  if (typeof value.completed !== 'boolean') return false
  return !isTaskTextEmpty(value.text) && !isTaskTextTooLong(value.text)
}

/** Whole-reject parser: any violation returns null; nothing partial escapes. */
export function parseBackup(source: string): Task[] | null {
  if (source.length > MAX_BACKUP_BYTES) return null
  let raw: unknown
  try {
    raw = JSON.parse(source)
  } catch {
    return null
  }
  if (!isPlainObject(raw)) return null
  if (raw.format !== BACKUP_FORMAT) return null
  if (raw.version !== BACKUP_VERSION) return null
  if (!isIsoInstant(raw.exportedAt)) return null
  if (!Array.isArray(raw.tasks)) return null
  if (!raw.tasks.every(isBackupTaskElement)) return null
  return raw.tasks.map((element) => ({
    id: crypto.randomUUID(),
    text: (element as { text: string }).text,
    completed: (element as { completed: boolean }).completed,
  }))
}
