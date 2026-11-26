import { describe, expect, it } from 'vitest'
import {
  BACKUP_FORMAT,
  MAX_BACKUP_BYTES,
  backupFileName,
  parseBackup,
  serializeBackup,
} from './backupFormat.ts'
import type { Task } from '../todo/useTasks.ts'

const tasks: Task[] = [
  { id: 'b', text: 'Pay rent', completed: true },
  { id: 'a', text: 'Buy milk', completed: false },
]

describe('backup file contract (S5)', () => {
  it('names the file with the LOCAL date', () => {
    expect(backupFileName(new Date(2026, 10, 26, 23, 59))).toBe(
      'odd-todo-backup-2026-11-26.json',
    )
    expect(backupFileName(new Date(2026, 0, 5))).toBe(
      'odd-todo-backup-2026-01-05.json',
    )
  })

  it('serializes format, version, exportedAt and the stored-shape tasks', () => {
    const parsed = JSON.parse(
      serializeBackup(tasks, new Date('2026-11-26T12:00:00.000Z')),
    )
    expect(parsed.format).toBe(BACKUP_FORMAT)
    expect(parsed.version).toBe(1)
    expect(parsed.exportedAt).toBe('2026-11-26T12:00:00.000Z')
    expect(parsed.tasks).toEqual(tasks)
  })

  it('serializes an empty list (S1: export works with no tasks)', () => {
    const parsed = JSON.parse(
      serializeBackup([], new Date('2026-11-26T12:00:00.000Z')),
    )
    expect(parsed.tasks).toEqual([])
  })

  it('parses a valid backup, preserving order, text as-is and completed', () => {
    const file = JSON.stringify({
      format: BACKUP_FORMAT,
      version: 1,
      exportedAt: '2026-11-26T12:00:00.000Z',
      tasks: [
        { id: 'x', text: ' padded but valid ', completed: true },
        { id: 'y', text: 'Buy milk', completed: false },
      ],
    })
    const result = parseBackup(file)
    expect(result).not.toBeNull()
    expect(result?.map((t) => t.text)).toEqual([
      ' padded but valid ',
      'Buy milk',
    ])
    expect(result?.[0]?.completed).toBe(true)
  })

  it('regenerates ids on import (unique, not the file ids)', () => {
    const file = JSON.stringify({
      format: BACKUP_FORMAT,
      version: 1,
      exportedAt: '2026-11-26T12:00:00.000Z',
      tasks: [
        { id: 'same', text: 'A', completed: false },
        { id: 'same', text: 'B', completed: false },
      ],
    })
    const result = parseBackup(file)
    expect(result).not.toBeNull()
    const ids = result?.map((t) => t.id) ?? []
    expect(ids).not.toContain('same')
    expect(new Set(ids).size).toBe(2)
  })

  it('drops unknown fields at every level (S6)', () => {
    const file = JSON.stringify({
      format: BACKUP_FORMAT,
      version: 1,
      exportedAt: '2026-11-26T12:00:00.000Z',
      evil: '<img src=x onerror=alert(1)>',
      tasks: [
        { id: 'a', text: 'A', completed: false, sneaky: true, style: 'x' },
      ],
    })
    const result = parseBackup(file)
    expect(result).not.toBeNull()
    expect(result?.[0]).toEqual({ id: result?.[0]?.id, text: 'A', completed: false })
    expect(Object.keys(result?.[0] ?? {})).toEqual(['id', 'text', 'completed'])
  })

  it('rejects whole files on any violation (S3, no partial imports)', () => {
    const base = {
      format: BACKUP_FORMAT,
      version: 1,
      exportedAt: '2026-11-26T12:00:00.000Z',
      tasks: [{ id: 'a', text: 'ok', completed: false }],
    }
    const file = (override: Record<string, unknown>) =>
      JSON.stringify({ ...base, ...override })

    expect(parseBackup('not json')).toBeNull()
    expect(parseBackup('null')).toBeNull()
    expect(parseBackup('[]')).toBeNull()
    expect(parseBackup(file({ version: 2 }))).toBeNull()
    expect(parseBackup(file({ version: '1' }))).toBeNull()
    expect(parseBackup(file({ format: 'other-app/backup' }))).toBeNull()
    expect(parseBackup(JSON.stringify({ version: 1, exportedAt: 'x', tasks: [] }))).toBeNull()
    expect(parseBackup(file({ tasks: 'nope' }))).toBeNull()
    expect(parseBackup(file({ tasks: [{ id: 'a', text: 'ok', completed: 'yes' }] }))).toBeNull()
    expect(parseBackup(file({ tasks: [{ id: 'a', completed: false }] }))).toBeNull()
    expect(parseBackup(file({ tasks: [{ text: 'a', completed: false }] }))).toBeNull()
  })

  it('rejects any task breaking the shared S1 rules; accepts the boundary', () => {
    const wrap = (texts: string[]) =>
      JSON.stringify({
        format: BACKUP_FORMAT,
        version: 1,
        exportedAt: '2026-11-26T12:00:00.000Z',
        tasks: texts.map((text, i) => ({
          id: `id-${i}`,
          text,
          completed: false,
        })),
      })
    expect(parseBackup(wrap(['   ']))).toBeNull()
    expect(parseBackup(wrap(['fine', 'x'.repeat(121)]))).toBeNull()
    expect(parseBackup(wrap(['x'.repeat(120)]))).not.toBeNull()
    expect(parseBackup(wrap([' fine ']))).not.toBeNull()
  })

  it('round-trips serialize→parse idempotently, modulo ids (verifier probe)', () => {
    const file = serializeBackup(tasks, new Date('2026-11-26T12:00:00.000Z'))
    const parsed = parseBackup(file)
    expect(parsed).not.toBeNull()
    const again = serializeBackup(parsed as Task[], new Date('2026-11-26T12:00:00.000Z'))
    expect(JSON.parse(again).tasks.map((t: Task) => [t.text, t.completed])).toEqual(
      tasks.map((t) => [t.text, t.completed]),
    )
  })

  it('enforces the exact size boundary: MAX accepted, MAX+1 rejected', () => {
    const envelope = {
      format: BACKUP_FORMAT,
      version: 1,
      exportedAt: '2026-11-26T12:00:00.000Z',
      pad: '',
      tasks: [{ id: 'a', text: 'ok', completed: false }],
    }
    const filler = (size: number) =>
      JSON.stringify({ ...envelope, pad: 'x'.repeat(size) }).length
    const padLength = MAX_BACKUP_BYTES - filler(0)
    const atLimit = JSON.stringify({ ...envelope, pad: 'x'.repeat(padLength) })
    expect(atLimit.length).toBe(MAX_BACKUP_BYTES)
    expect(parseBackup(atLimit)).not.toBeNull()
    expect(parseBackup(`${atLimit}y`)).toBeNull()
  })

  it('rejects oversized sources', () => {
    const big = JSON.stringify({
      format: BACKUP_FORMAT,
      version: 1,
      exportedAt: '2026-11-26T12:00:00.000Z',
      tasks: [{ id: 'a', text: 'z'.repeat(MAX_BACKUP_BYTES), completed: false }],
    })
    expect(parseBackup(big)).toBeNull()
  })
})
