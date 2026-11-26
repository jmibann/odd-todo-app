import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Enforces AGENTS.md B5 / odd-todo-app requirement 2 + the responsive rule:
 * raw colors, px/rem numbers, literal font sizes and raw vw/vh/% values
 * may only live in src/shared/styles/tokens.css. Every other .css under
 * src/ is scanned (modules included); failures name file and line.
 * No Stylelint, no new dependency.
 */

const RULES: { name: string; pattern: RegExp }[] = [
  {
    name: 'raw color',
    pattern: /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/,
  },
  {
    name: 'px/rem value',
    pattern: /\d+(?:\.\d+)?(?:px|rem)\b/,
  },
  {
    name: 'raw duration',
    pattern: /\d+(?:\.\d+)?(?:ms|s)\b/,
  },
  {
    name: 'raw viewport unit or %',
    pattern: /\d+(?:\.\d+)?(?:[dsl]?v[wfh]|vmin|vmax)\b|%/,
  },
]

const TOKENS_FILE = join('src', 'shared', 'styles', 'tokens.css')

function cssFiles(dir: string): string[] {
  const found: string[] = []
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) {
      found.push(...cssFiles(path))
    } else if (
      entry.endsWith('.css') &&
      relative(process.cwd(), path) !== TOKENS_FILE
    ) {
      found.push(path)
    }
  }
  return found
}

describe('B5 token discipline', () => {
  it('no .css outside tokens.css uses raw values', () => {
    const violations: string[] = []
    const files = cssFiles(join(process.cwd(), 'src'))
    expect(files.length).toBeGreaterThan(0)

    for (const file of files) {
      const lines = readFileSync(file, 'utf8').split(/\r?\n/)
      lines.forEach((line, index) => {
        const trimmed = line.trim()
        if (trimmed.startsWith('/*') || trimmed.startsWith('*')) return
        for (const rule of RULES) {
          if (rule.pattern.test(line)) {
            violations.push(
              `${relative(process.cwd(), file)}:${index + 1}: ${rule.name} → "${trimmed}"`,
            )
          }
        }
        // font-size must reference a token; checked on the declared value
        // so that backtracking cannot make a naive lookahead misfire.
        const fontSize = line.match(/\bfont-size\s*:\s*([^;{}]+)/)
        if (fontSize && !fontSize[1].trim().startsWith('var(')) {
          violations.push(
            `${relative(process.cwd(), file)}:${index + 1}: font size outside tokens → "${trimmed}"`,
          )
        }
      })
    }

    expect(violations).toEqual([])
  })
})

describe('B5 scanner rules (regression fixtures)', () => {
  // Guards the gate itself: if a RULES regex is ever broken, these fail even
  // though the repo scan stays green. Proven by the verifier on HEAD e349aab.
  const fires = (ruleName: string, line: string): boolean => {
    const rule = RULES.find((r) => r.name === ruleName)
    expect(rule, `rule ${ruleName} exists`).toBeTruthy()
    return new RegExp(rule?.pattern.source ?? '').test(line)
  }

  it('flags the raw values L10.2 named', () => {
    expect(fires('raw duration', 'transition: color 300ms;')).toBe(true)
    expect(fires('raw duration', 'animation: x 2s;')).toBe(true)
    expect(fires('raw viewport unit or %', 'min-height: 100dvh;')).toBe(true)
    expect(fires('raw viewport unit or %', 'width: 50svw;')).toBe(true)
    expect(fires('raw viewport unit or %', 'padding: 2%;')).toBe(true)
    expect(fires('raw color', 'color: #123456;')).toBe(true)
    expect(fires('px/rem value', 'margin: 4px;')).toBe(true)
  })

  it('does not flag token usage or unitless values', () => {
    expect(fires('raw duration', 'transition: color var(--duration-fast) ease;')).toBe(false)
    expect(fires('px/rem value', 'z-index: 10;')).toBe(false)
    expect(fires('px/rem value', 'flex: 1 1 0;')).toBe(false)
    expect(fires('px/rem value', 'opacity: 0.5;')).toBe(false)
    expect(fires('px/rem value', 'line-height: 1.5;')).toBe(false)
    expect(fires('raw viewport unit or %', 'height: var(--size-viewport-min-height);')).toBe(false)
  })
})
