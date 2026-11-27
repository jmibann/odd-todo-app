import { useCallback, useState } from 'react'
import type { StatusFilter } from './filterTasks.ts'

/**
 * Filter state mirrored into the URL (odd/tasks/filter-search.md S4):
 * "?q=<query>&status=active|completed. Defaults are omitted from the URL.
 * Changes replace the current history entry instead of adding new ones.
 * A reload or a shared link restores the same view. An unknown status
 * value falls back to \"All\"." Never touches localStorage or task data
 * (S5) — this hook only reads and writes window.location.search.
 */

export type UrlFilter = { q: string; status: StatusFilter }

export function parseFilterSearch(search: string): UrlFilter {
  const params = new URLSearchParams(search)
  const rawStatus = params.get('status')
  const status: StatusFilter =
    rawStatus === 'active' || rawStatus === 'completed' ? rawStatus : 'all'
  return { q: params.get('q') ?? '', status }
}

export function buildFilterSearch(q: string, status: StatusFilter): string {
  const params = new URLSearchParams()
  if (q !== '') params.set('q', q)
  if (status !== 'all') params.set('status', status)
  const search = params.toString()
  return search === '' ? '' : `?${search}`
}

export function useTaskUrlFilter(): {
  q: string
  status: StatusFilter
  setQ: (q: string) => void
  setStatus: (status: StatusFilter) => void
} {
  const [filter, setFilter] = useState<UrlFilter>(() =>
    parseFilterSearch(window.location.search),
  )

  // The URL is rebuilt inside the updater so that two changes issued in
  // the same tick compose instead of clobbering each other. replaceState
  // with the same inputs is idempotent, which keeps it safe when
  // StrictMode runs an updater twice. The current history entry is always
  // REPLACED — pushState is forbidden by S4.
  const update = useCallback((change: Partial<UrlFilter>) => {
    setFilter((previous) => {
      const next = { ...previous, ...change }
      const { pathname, hash } = window.location
      window.history.replaceState(
        window.history.state,
        '',
        `${pathname}${buildFilterSearch(next.q, next.status)}${hash}`,
      )
      return next
    })
  }, [])

  const setQ = useCallback((q: string) => update({ q }), [update])
  const setStatus = useCallback(
    (status: StatusFilter) => update({ status }),
    [update],
  )

  return { q: filter.q, status: filter.status, setQ, setStatus }
}
