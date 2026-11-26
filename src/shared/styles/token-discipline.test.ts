import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Enforces AGENTS.md B5 (L15: the scanner enforces the RULE, not a list of
 * units). Allowlist check on every .css file under src/ except
 * tokens.css: any number with a unit, any %, any hex and any color function
 * FAILS, case-insensitively. Allowed: var(--…), unitless numbers, keywords.
 * Failures name file and line. No Stylelint, no new dependency.
 */

const SIMPLE_VAR = /var\(--[\w-]+\)/gi

type Rule = { name: string; test: (stripped: string) => boolean }

const RULES: Rule[] = [
  {
    name: 'number with unit',
    test: (s) => /\d+(?:\.\d+)?[a-z]+/i.test(s),
  },
  {
    name: 'percent',
    test: (s) => s.includes('%'),
  },
  {
    name: 'hex color',
    test: (s) => /#[0-9a-f]{3,8}\b/i.test(s),
  },
  {
    name: 'color function',
    test: (s) =>
      /\b(?:rgba?|hsla?|hwb|lab|lch|color(?:-mix)?|light-dark)\s*\(/i.test(s),
  },
]

function scanLine(line: string): string[] {
  const stripped = line.replace(SIMPLE_VAR, '')
  const found = RULES.filter((rule) => rule.test(stripped)).map(
    (rule) => rule.name,
  )
  // font-size must reference a token (checked on the declared value)
  const fontSize = line.match(/\bfont-size\s*:\s*([^;{}]+)/i)
  if (fontSize && !fontSize[1].trim().toLowerCase().startsWith('var(')) {
    found.push('font size outside tokens')
  }
  return found
}

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
        for (const name of scanLine(line)) {
          violations.push(
            `${relative(process.cwd(), file)}:${index + 1}: ${name} → "${trimmed}"`,
          )
        }
      })
    }

    expect(violations).toEqual([])
  })
})

describe('B5 scanner rules (regression fixtures)', () => {
  const fires = (ruleName: string, line: string): boolean => {
    if (ruleName === 'font size outside tokens') {
      return scanLine(line).includes(ruleName)
    }
    const stripped = line.replace(SIMPLE_VAR, '')
    const rule = RULES.find((r) => r.name === ruleName)
    expect(rule, `rule ${ruleName} exists`).toBeTruthy()
    return rule?.test(stripped) ?? false
  }

  it('flags the raw values L10.2 named', () => {
    expect(fires('number with unit', 'transition: color 300ms;')).toBe(true)
    expect(fires('number with unit', 'animation: x 2s;')).toBe(true)
    expect(fires('number with unit', 'min-height: 100dvh;')).toBe(true)
    expect(fires('number with unit', 'width: 50svw;')).toBe(true)
    expect(fires('percent', 'padding: 2%;')).toBe(true)
    expect(fires('hex color', 'color: #123456;')).toBe(true)
    expect(fires('number with unit', 'margin: 4px;')).toBe(true)
  })

  it('does not flag token usage or unitless values', () => {
    expect(
      fires('number with unit', 'transition: color var(--duration-fast) ease;'),
    ).toBe(false)
    expect(fires('number with unit', 'z-index: 10;')).toBe(false)
    expect(fires('number with unit', 'flex: 1 1 0;')).toBe(false)
    expect(fires('number with unit', 'opacity: 0.5;')).toBe(false)
    expect(fires('number with unit', 'line-height: 1.5;')).toBe(false)
    expect(
      fires('number with unit', 'height: var(--size-viewport-min-height);'),
    ).toBe(false)
  })

  it('flags case-variants and container units (L15 positives)', () => {
    expect(fires('number with unit', 'width: 10PX;')).toBe(true)
    expect(fires('number with unit', 'width: 50cqw;')).toBe(true)
    expect(fires('number with unit', 'transition: all 300MS;')).toBe(true)
    expect(fires('number with unit', 'height: 100DVH;')).toBe(true)
    expect(fires('hex color', 'color: #FFF;')).toBe(true)
    expect(fires('color function', 'color: RGBA(1, 2, 3, 0.5);')).toBe(true)
    expect(fires('color function', 'color: rgb(1, 2, 3);')).toBe(true)
  })
})
