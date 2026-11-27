import { describe, expect, it } from 'vitest'
import { filterTasks, matchesQuery, matchesStatus } from './filterTasks.ts'
import type { Task } from '../todo/useTasks.ts'

const tasks: Task[] = [
  { id: '3', text: 'Buy milk', completed: false },
  { id: '2', text: 'PAY rent', completed: true },
  { id: '1', text: 'Käse kaufen', completed: false },
]

describe('matchesQuery (S1)', () => {
  // "Matching is a case-insensitive substring match on the trimmed query.
  // An empty query matches everything."
  it('is a case-insensitive substring match on the trimmed query', () => {
    expect(matchesQuery(tasks[0]!, 'MILK')).toBe(true)
    expect(matchesQuery(tasks[0]!, 'y mi')).toBe(true)
    expect(matchesQuery(tasks[1]!, 'pay')).toBe(true)
    expect(matchesQuery(tasks[0]!, '  milk  ')).toBe(true)
    expect(matchesQuery(tasks[0]!, '')).toBe(true)
    expect(matchesQuery(tasks[0]!, '   \t ')).toBe(true)
    expect(matchesQuery(tasks[0]!, 'rent')).toBe(false)
  })

  it('matches unicode case-insensitively', () => {
    expect(matchesQuery(tasks[2]!, 'KÄSE')).toBe(true)
    expect(matchesQuery(tasks[2]!, 'käse')).toBe(true)
  })

  it('matches a substring of a full 120-character task text', () => {
    const long: Task = {
      id: 'l',
      text: `${'word '.repeat(20)}${'x'.repeat(20)}`,
      completed: false,
    }
    expect(long.text).toHaveLength(120)
    expect(matchesQuery(long, 'xxxxx')).toBe(true)
    expect(matchesQuery(long, 'word word word')).toBe(true)
    expect(matchesQuery(long, 'zzz')).toBe(false)
  })
})

describe('matchesStatus (S2)', () => {
  it('splits by completion with "all" passing everything', () => {
    expect(matchesStatus(tasks[0]!, 'all')).toBe(true)
    expect(matchesStatus(tasks[1]!, 'all')).toBe(true)
    expect(matchesStatus(tasks[0]!, 'active')).toBe(true)
    expect(matchesStatus(tasks[1]!, 'active')).toBe(false)
    expect(matchesStatus(tasks[0]!, 'completed')).toBe(false)
    expect(matchesStatus(tasks[1]!, 'completed')).toBe(true)
  })
})

describe('filterTasks (S3, S5)', () => {
  // "Search and status combine."
  it('combines search AND status', () => {
    expect(filterTasks(tasks, { q: 'buy', status: 'active' })).toEqual([tasks[0]])
    expect(filterTasks(tasks, { q: 'buy', status: 'completed' })).toEqual([])
    expect(filterTasks(tasks, { q: 'pay', status: 'completed' })).toEqual([tasks[1]])
    expect(filterTasks(tasks, { q: 'b u y', status: 'all' })).toEqual([])
  })

  // S5: "Filters only change what is shown, never what is stored or its order."
  it('keeps input order, returns a new array and never mutates the input', () => {
    const snapshot = structuredClone(tasks)
    const result = filterTasks(tasks, { q: '', status: 'all' })
    expect(result).not.toBe(tasks)
    expect(result).toEqual(snapshot)
    expect(filterTasks(tasks, { q: 'k', status: 'active' }).map((t) => t.id)).toEqual([
      '3',
      '1',
    ])
    expect(tasks).toEqual(snapshot)
    expect(tasks).toHaveLength(3)
  })
})
