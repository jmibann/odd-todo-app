import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useTaskUrlFilter } from './useTaskUrlFilter.ts'

beforeEach(() => window.history.replaceState(null, '', '/'))
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('useTaskUrlFilter (S4)', () => {
  // S4 (odd/tasks/filter-search.md): "The filter state lives in the URL:
  // ?q=<query>&status=active|completed. … A reload or a shared link
  // restores the same view. An unknown status value falls back to \"All\"."
  it('restores q and status from a shared link', () => {
    window.history.replaceState(null, '', '/?q=milk&status=completed')
    const { result } = renderHook(() => useTaskUrlFilter())
    expect(result.current.q).toBe('milk')
    expect(result.current.status).toBe('completed')
  })

  it('defaults to an empty query and "all" when the URL carries no params', () => {
    const { result } = renderHook(() => useTaskUrlFilter())
    expect(result.current.q).toBe('')
    expect(result.current.status).toBe('all')
  })

  it('falls back to "all" for an unknown status value', () => {
    window.history.replaceState(null, '', '/?status=bogus')
    const { result } = renderHook(() => useTaskUrlFilter())
    expect(result.current.status).toBe('all')
  })

  // "Changes replace the current history entry instead of adding new ones."
  it('writes changes through replaceState only, never pushState', () => {
    const replace = vi.spyOn(window.history, 'replaceState')
    const push = vi.spyOn(window.history, 'pushState')
    const { result } = renderHook(() => useTaskUrlFilter())
    act(() => result.current.setQ('milk'))
    act(() => result.current.setStatus('active'))
    expect(push).not.toHaveBeenCalled()
    expect(replace).toHaveBeenCalled()
    expect(window.location.search).toBe('?q=milk&status=active')
    expect(result.current.q).toBe('milk')
    expect(result.current.status).toBe('active')
  })

  // "Defaults are omitted from the URL."
  it('omits default values and keeps the path', () => {
    const { result } = renderHook(() => useTaskUrlFilter())
    act(() => result.current.setQ('milk'))
    act(() => result.current.setStatus('all'))
    expect(window.location.search).toBe('?q=milk')
    act(() => result.current.setQ(''))
    expect(window.location.search).toBe('')
    expect(window.location.pathname).toBe('/')
  })

  it('round-trips queries with spaces through the URL', () => {
    const { result } = renderHook(() => useTaskUrlFilter())
    act(() => result.current.setQ('  buy milk  '))
    const restored = renderHook(() => useTaskUrlFilter())
    expect(restored.result.current.q).toBe('  buy milk  ')
    expect(restored.result.current.status).toBe('all')
  })
})
