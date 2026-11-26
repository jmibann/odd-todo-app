import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

/*
 * Integrity guard against the write-pipeline corruption seen in this
 * feature (odd/tasks/ui-policy.md L11): a three-character token was
 * repeatedly mangled into an asterisk run. The forbidden literal is
 * built at runtime so this file can never contain it itself.
 */
const FORBIDDEN = '*'.repeat(3)

function filesUnder(dir: string): string[] {
  const found: string[] = []
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) {
      found.push(...filesUnder(path))
    } else {
      found.push(path)
    }
  }
  return found
}

describe('source integrity', () => {
  it('no file under src/, e2e/ or odd/ contains the corrupted asterisk literal', () => {
    const hits: string[] = []
    for (const root of ['src', 'e2e', 'odd']) {
      for (const file of filesUnder(root)) {
        const lines = readFileSync(file, 'utf8').split(/\r?\n/)
        lines.forEach((line, index) => {
          if (line.includes(FORBIDDEN)) {
            hits.push(`${relative(process.cwd(), file)}:${index + 1}`)
          }
        })
      }
    }
    expect(hits).toEqual([])
  })
})
