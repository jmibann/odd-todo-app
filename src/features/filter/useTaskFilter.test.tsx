import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useTaskFilter } from './useTaskFilter.ts'
import type { Task } from '../todo/useTasks.ts'

const tasks: Task[] = [
  { id: '2', text: 'Buy milk', completed: false },
  { id: '1', text: 'Milk the cat', completed: true },
  { id: '0', text: 'Pay rent', completed: false },
]

beforeEach(() => {
  window.history.replaceState(null, '', '/')
  window.localStorage.clear()
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('useTaskFilter (S4, S5)', () => {
  it('derives visible from the URL-restored filter, keeping order', () => {
    window.history.replaceState(null, '', '/?q=milk&status=active')
    const { result } = renderHook(() => useTaskFilter(tasks))
    expect(result.current.q).toBe('milk')
    expect(result.current.status).toBe('active')
    expect(result.current.visible).toEqual([tasks[0]])
  })

  it('setQ and setStatus update both the URL and the visible list', () => {
    const { result } = renderHook(() => useTaskFilter(tasks))
    act(() => result.current.setQ('milk'))
    act(() => result.current.setStatus('completed'))
    expect(window.location.search).toBe('?q=milk&status=completed')
    expect(result.current.visible).toEqual([tasks[1]])
    act(() => result.current.setStatus('all'))
    expect(window.location.search).toBe('?q=milk')
    expect(result.current.visible).toEqual([tasks[0], tasks[1]])
  })

  // S5: "Filters only change what is shown, never what is stored or its
  // order." — a fresh array over the same items, input untouched, no
  // storage access at all.
  it('never mutates the input array and never touches storage', () => {
    const get = vi.spyOn(window.localStorage.__proto__, 'getItem')
    const set = vi.spyOn(window.localStorage.__proto__, 'setItem')
    const snapshot = structuredClone(tasks)
    const { result } = renderHook(() => useTaskFilter(tasks))
    const all = result.current.visible
    expect(all).not.toBe(tasks)
    expect(all.map((task) => task.id)).toEqual(['2', '1', '0'])
    act(() => result.current.setQ(' rent '))
    expect(result.current.visible).toEqual([tasks[2]])
    expect(tasks).toEqual(snapshot)
    expect(get).not.toHaveBeenCalled()
    expect(set).not.toHaveBeenCalled()
  })
})
