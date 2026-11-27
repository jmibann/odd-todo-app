import { describe, expect, it } from 'vitest'
import type { Task } from '../todo/useTasks.ts'
import { captureDeleted } from './deletedTask.ts'

// undo-delete.md S7: the caller needs the removed task and its position
// before removeTask runs. One RED test per rule.
describe('captureDeleted (undo-delete S7)', () => {
  const tasks: Task[] = [
    { id: 'a', text: 'Task A', completed: false },
    { id: 'b', text: 'Task B', completed: true },
    { id: 'c', text: 'Task C', completed: false },
  ]

  it('returns the task and its index for a known id, null otherwise', () => {
    expect(captureDeleted(tasks, 'b')).toEqual({
      task: { id: 'b', text: 'Task B', completed: true },
      index: 1,
    })
    expect(captureDeleted(tasks, 'zzz')).toBeNull()
    expect(captureDeleted([], 'a')).toBeNull()
  })
})
