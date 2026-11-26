import { beforeEach, describe, expect, it } from 'vitest'
import { loadItem, removeItem, saveItem } from './storage.ts'

beforeEach(() => {
  window.localStorage.clear()
})

describe('storage', () => {
  it('round-trips typed JSON values through a namespaced key', () => {
    saveItem('theme', 'dark' as const)
    expect(loadItem('theme', 'light')).toBe('dark')

    saveItem('prefs', { count: 3, on: true })
    expect(loadItem('prefs', { count: 0, on: false })).toEqual({
      count: 3,
      on: true,
    })
  })

  it('returns the fallback when nothing is stored', () => {
    expect(loadItem('missing', 'fallback')).toBe('fallback')
  })

  it('returns the fallback when the stored JSON is broken', () => {
    window.localStorage.setItem('odd-todo-app:broken', '{not json')
    expect(loadItem('broken', 'fallback')).toBe('fallback')
  })

  it('removes stored items', () => {
    saveItem('theme', 'dark')
    removeItem('theme')
    expect(loadItem('theme', 'light')).toBe('light')
  })

  it('namespaces keys under the app prefix', () => {
    saveItem('theme', 'dark')
    const keys = Object.keys(window.localStorage)
    expect(keys).toEqual(['odd-todo-app:theme'])
  })
})
