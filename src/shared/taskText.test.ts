import { describe, expect, it } from 'vitest'
import {
  MAX_TASK_LENGTH,
  isTaskTextEmpty,
  isTaskTextTooLong,
} from './taskText.ts'

describe('shared task-text rules (todo-core S1)', () => {
  it('exposes the 120-character limit', () => {
    expect(MAX_TASK_LENGTH).toBe(120)
  })

  it('treats empty and whitespace-only text as empty', () => {
    expect(isTaskTextEmpty('')).toBe(true)
    expect(isTaskTextEmpty('   \t ')).toBe(true)
    expect(isTaskTextEmpty(' x ')).toBe(false)
  })

  it('measures length on the trimmed text, boundary at exactly 120', () => {
    expect(isTaskTextTooLong('x'.repeat(120))).toBe(false)
    expect(isTaskTextTooLong('x'.repeat(121))).toBe(true)
    expect(isTaskTextTooLong(` ${'x'.repeat(121)} `)).toBe(true)
    expect(isTaskTextTooLong(` ${'x'.repeat(120)} `)).toBe(false)
  })
})
