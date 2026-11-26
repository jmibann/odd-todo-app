/**
 * The ONLY access point to localStorage (AGENTS.md B3).
 * Keys are namespaced per app; values are typed JSON. Reads never throw:
 * missing or corrupt entries fall back to the caller's default.
 */

const APP_PREFIX = 'odd-todo-app:'

export function loadItem<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(APP_PREFIX + key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function saveItem<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(APP_PREFIX + key, JSON.stringify(value))
  } catch {
    // Storage can fail (private mode, quota). The app keeps working
    // for this session; nothing to recover from.
  }
}

export function removeItem(key: string): void {
  try {
    window.localStorage.removeItem(APP_PREFIX + key)
  } catch {
    // see saveItem
  }
}
