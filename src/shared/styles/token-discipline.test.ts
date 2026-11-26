import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { parse as parseCss, type Root } from 'postcss'
import valueParser from 'postcss-value-parser'
import { describe, expect, it } from 'vitest'

/**
 * Enforces AGENTS.md B5 (L15 + L17 + L19: allowlist enforced on declaration
 * VALUES and at-rule PARAMS via postcss + postcss-value-parser, not regex
 * on lines). Selectors, comments and url() are never scanned.
 * In any .css except tokens.css:
 *  - any number with a unit fails (whitelist: fr, any amount)
 *  - any % fails; any hex outside url() fails
 *  - any color function fails (case-insensitive)
 *  - named colors fail; only transparent, currentColor and the CSS-wide
 *    keywords (inherit/initial/unset/revert) are allowed (L19.1)
 *  - the first minmax() argument must be a simple var(--…) token or 0
 *  - font-size must reference a token
 * Selectors, comments and url(…) contents are not declaration values and
 * are never scanned. Failures name file and line.
 */

const TOKENS_FILE = join('src', 'shared', 'styles', 'tokens.css')

const COLOR_FUNCTIONS = new Set([
  'rgb',
  'rgba',
  'hsl',
  'hsla',
  'hwb',
  'lab',
  'lch',
  'oklab',
  'oklch',
  'color',
  'color-mix',
  'light-dark',
])

const ALLOWED_KEYWORDS = new Set([
  'transparent',
  'currentcolor',
  'inherit',
  'initial',
  'unset',
  'revert',
])

const NAMED_COLORS = new Set([
  'aliceblue', 'antiquewhite', 'aqua', 'aquamarine', 'azure', 'beige',
  'bisque', 'black', 'blanchedalmond', 'blue', 'blueviolet', 'brown',
  'burlywood', 'cadetblue', 'chartreuse', 'chocolate', 'coral',
  'cornflowerblue', 'cornsilk', 'crimson', 'cyan', 'darkblue', 'darkcyan',
  'darkgoldenrod', 'darkgray', 'darkgreen', 'darkgrey', 'darkkhaki',
  'darkmagenta', 'darkolivegreen', 'darkorange', 'darkorchid', 'darkred',
  'darksalmon', 'darkseagreen', 'darkslateblue', 'darkslategray',
  'darkslategrey', 'darkturquoise', 'darkviolet', 'deeppink', 'deepskyblue',
  'dimgray', 'dimgrey', 'dodgerblue', 'firebrick', 'floralwhite',
  'forestgreen', 'fuchsia', 'gainsboro', 'ghostwhite', 'gold', 'goldenrod',
  'gray', 'green', 'greenyellow', 'grey', 'honeydew', 'hotpink', 'indianred',
  'indigo', 'ivory', 'khaki', 'lavender', 'lavenderblush', 'lawngreen',
  'lemonchiffon', 'lightblue', 'lightcoral', 'lightcyan',
  'lightgoldenrodyellow', 'lightgray', 'lightgreen', 'lightgrey',
  'lightpink', 'lightsalmon', 'lightseagreen', 'lightskyblue',
  'lightslategray', 'lightslategrey', 'lightsteelblue', 'lightyellow',
  'lime', 'limegreen', 'linen', 'magenta', 'maroon', 'mediumaquamarine',
  'mediumblue', 'mediumorchid', 'mediumpurple', 'mediumseagreen',
  'mediumslateblue', 'mediumspringgreen', 'mediumturquoise',
  'mediumvioletred', 'midnightblue', 'mintcream', 'mistyrose', 'moccasin',
  'navajowhite', 'navy', 'oldlace', 'olive', 'olivedrab', 'orange',
  'orangered', 'orchid', 'palegoldenrod', 'palegreen', 'paleturquoise',
  'palevioletred', 'papayawhip', 'peachpuff', 'peru', 'pink', 'plum',
  'powderblue', 'purple', 'rebeccapurple', 'red', 'rosybrown', 'royalblue',
  'saddlebrown', 'salmon', 'sandybrown', 'seagreen', 'seashell', 'sienna',
  'silver', 'skyblue', 'slateblue', 'slategray', 'slategrey', 'snow',
  'springgreen', 'steelblue', 'tan', 'teal', 'thistle', 'tomato',
  'turquoise', 'violet', 'wheat', 'white', 'whitesmoke', 'yellow',
  'yellowgreen',
])

const NUMBER_WITH_UNIT = /^[-+]?(?:\d+(?:\.\d+)?|\.\d+)([a-z]+|%)$/i

type VNode = {
  type: string
  value: string
  nodes?: VNode[]
}

function checkWord(raw: string): string[] {
  const word = raw.toLowerCase()
  if (ALLOWED_KEYWORDS.has(word)) return []
  if (word.startsWith('--')) return []
  const found: string[] = []
  if (/%/.test(raw)) found.push('percent')
  if (raw.startsWith('#')) found.push('hex outside url')
  const m = NUMBER_WITH_UNIT.exec(raw)
  if (m && m[1].toLowerCase() !== 'fr') found.push('number with unit')
  if (NAMED_COLORS.has(word)) found.push('named color')
  return found
}

function checkNodes(nodes: VNode[]): string[] {
  const found: string[] = []
  for (const node of nodes) {
    if (node.type === 'function') {
      const name = node.value.toLowerCase()
      if (name === 'url') continue
      if (COLOR_FUNCTIONS.has(name)) found.push('color function')
      const args: VNode[] = node.nodes ?? []
      if (name === 'minmax') {
        const divAt = args.findIndex((a) => a.type === 'div')
        const firstArg = (divAt === -1 ? args : args.slice(0, divAt)).filter(
          (a) => a.type !== 'space',
        )
        const token = firstArg[0]
        let okFirstArg = false
        if (firstArg.length === 1 && token?.type === 'word') {
          okFirstArg = /^0+(?:\.0+)?$/.test(token.value)
        }
        if (
          firstArg.length === 1 &&
          token?.type === 'function' &&
          token.value.toLowerCase() === 'var'
        ) {
          const inner = (token.nodes ?? []).filter((a) => a.type !== 'space')
          okFirstArg =
            inner.length === 1 &&
            inner[0]?.type === 'word' &&
            /^--[\w-]+$/.test(String(inner[0]?.value))
        }
        if (!okFirstArg) {
          found.push('minmax first argument outside tokens')
        }
      }
      found.push(...checkNodes(args as VNode[]))
      continue
    }
    if (node.type === 'word') {
      found.push(...checkWord(node.value))
      continue
    }
    if (node.type === 'string') {
      const v = node.value
      const m = NUMBER_WITH_UNIT.exec(v)
      if (m && m[1].toLowerCase() !== 'fr') found.push('number with unit')
      if (v.includes('%')) found.push('percent')
      if (v.startsWith('#')) found.push('hex outside url')
      continue
    }
  }
  return found
}

function declViolations(prop: string, value: string): string[] {
  const found = checkNodes(valueParser(value).nodes as VNode[])
  if (
    prop.toLowerCase() === 'font-size' &&
    !value.trim().toLowerCase().startsWith('var(')
  ) {
    found.push('font size outside tokens')
  }
  return found
}

function checkParams(params: string): string[] {
  // At-rule params are scanned (L19.3) after stripping comments, url() and
  // strings. Colors and named colors make no sense in at-rule params, but
  // raw lengths/percentages do not belong there either (B5).
  const text = params
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/url\([^)]*\)/gi, ' ')
    .replace(/(['"])(?:\\.|(?!\1).)*\1/g, ' ')
  const found: string[] = []
  const withUnit = /[-+]?(?:\d+(?:\.\d+)?|\.\d+)([a-z]+|%)|%/gi
  let m
  while ((m = withUnit.exec(text)) !== null) {
    if (m[1] === undefined) {
      found.push('percent')
    } else if (m[1].toLowerCase() !== 'fr') {
      found.push(m[1] === '%' ? 'percent' : 'number with unit')
    }
  }
  if (/#\d/i.test(text)) found.push('hex outside url')
  if (
    /\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|light-dark)\s*\(/i.test(text)
  ) {
    found.push('color function')
  }
  return found
}

function scanCss(css: string): string[] {
  const out: string[] = []
  let root: Root
  try {
    root = parseCss(css)
  } catch (e) {
    return [`unparseable css → ${String(e).slice(0, 90)}`]
  }
  root.walkAtRules((atRule) => {
    for (const name of new Set(checkParams(atRule.params))) {
      const line = atRule.source?.start?.line ?? 1
      out.push(`${line}: ${name} → "@${atRule.name} ${atRule.params}"`)
    }
  })
  root.walkDecls((decl) => {
    for (const name of new Set(declViolations(decl.prop, decl.value))) {
      const line = decl.source?.start?.line ?? 1
      out.push(`${line}: ${name} → "${decl.prop}: ${decl.value}"`)
    }
  })
  return out
}

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
      for (const hit of scanCss(readFileSync(file, 'utf8'))) {
        violations.push(`${relative(process.cwd(), file)}:${hit}`)
      }
    }
    expect(violations).toEqual([])
  })
})

describe('B5 scanner rules (regression fixtures)', () => {
  const fires = (ruleName: string, value: string, prop = 'color'): boolean =>
    declViolations(prop, value).includes(ruleName)

  it('flags the raw values L10.2 named', () => {
    expect(fires('number with unit', '300ms', 'transition-duration')).toBe(true)
    expect(fires('number with unit', '2s', 'animation-duration')).toBe(true)
    expect(fires('number with unit', '100dvh', 'min-height')).toBe(true)
    expect(fires('number with unit', '50svw', 'width')).toBe(true)
    expect(fires('percent', '2%', 'padding')).toBe(true)
    expect(fires('hex outside url', '#123456')).toBe(true)
    expect(fires('number with unit', '4px', 'margin')).toBe(true)
  })

  it('does not flag token usage or unitless values', () => {
    expect(
      fires('number with unit', 'var(--duration-fast) ease', 'transition'),
    ).toBe(false)
    expect(fires('number with unit', '10', 'z-index')).toBe(false)
    expect(fires('number with unit', '1 1 0', 'flex')).toBe(false)
    expect(fires('number with unit', '0.5', 'opacity')).toBe(false)
    expect(fires('number with unit', '1.5', 'line-height')).toBe(false)
    expect(
      fires('number with unit', 'var(--size-viewport-min-height)', 'height'),
    ).toBe(false)
  })

  it('flags case-variants and container units (L15 positives)', () => {
    expect(fires('number with unit', '10PX', 'width')).toBe(true)
    expect(fires('number with unit', '50cqw', 'width')).toBe(true)
    expect(fires('number with unit', '300MS', 'transition-duration')).toBe(true)
    expect(fires('number with unit', '100DVH', 'min-height')).toBe(true)
    expect(fires('hex outside url', '#FFF')).toBe(true)
    expect(fires('color function', 'RGBA(1, 2, 3, 0.5)')).toBe(true)
    expect(fires('color function', 'rgb(1, 2, 3)')).toBe(true)
  })

  it('bans named colors, allows the documented keyword set (L17.1)', () => {
    expect(fires('named color', 'white')).toBe(true)
    expect(fires('named color', 'RebeccaPurple')).toBe(true)
    expect(fires('named color', 'darkred')).toBe(true)
    expect(fires('named color', 'transparent')).toBe(false)
    expect(fires('named color', 'currentColor')).toBe(false)
    expect(fires('named color', 'inherit')).toBe(false)
    expect(fires('named color', 'initial')).toBe(false)
    expect(fires('named color', 'unset')).toBe(false)
    expect(fires('named color', 'revert')).toBe(false)
    expect(fires('named color', 'var(--color-text)')).toBe(false)
  })

  it('whitelists fr but keeps minmax first argument token-only (L17.2)', () => {
    expect(fires('number with unit', '1fr', 'grid-template-columns')).toBe(false)
    expect(fires('number with unit', '2.5fr', 'grid-template-columns')).toBe(false)
    expect(fires('number with unit', '1FR', 'grid-template-columns')).toBe(false)
    expect(fires('number with unit', '2Fr', 'grid-template-columns')).toBe(false)
    expect(
      fires('minmax first argument outside tokens', 'minmax(var(--x, 10px), 1fr)'),
    ).toBe(true)
    expect(
      declViolations(
        'grid-template-columns',
        'repeat(auto-fit, minmax(var(--x), 1fr))',
      ),
    ).toEqual([])
    expect(
      fires('minmax first argument outside tokens', 'minmax(10px, 1fr)'),
    ).toBe(true)
    expect(fires('number with unit', 'minmax(0, 1fr)')).toBe(false)
    expect(
      declViolations('grid-template-columns', 'repeat(3, minmax(0, 1fr))'),
    ).toEqual([])
    expect(fires('number with unit', 'calc(var(--space-md) * 2)')).toBe(false)
    expect(fires('number with unit', 'var(--x, 10px)')).toBe(true)
  })

  it('never scans selectors, comments or url contents (L17.3 probes)', () => {
    expect(
      scanCss('.a:nth-child(2n + 1) { color: var(--color-text); }'),
    ).toEqual([])
    expect(scanCss('.a { background: url(#abc); }')).toEqual([])
    expect(scanCss('/* legacy 10px */\n.a { color: var(--color-text); }')).toEqual([])
    expect(scanCss('.a { background: white; }')).toEqual([
      '1: named color → "background: white"',
    ])
    expect(
      scanCss('.a { grid-template-columns: repeat(auto-fit, minmax(var(--x), 1fr)); }'),
    ).toEqual([])
    expect(
      scanCss('@media (max-width: 640px) { .a { color: var(--color-text); } }'),
    ).toEqual(['1: number with unit → "@media (max-width: 640px)"'])
    expect(fires('font size outside tokens', 'VAR(--x)', 'font-size')).toBe(false)
    expect(scanCss('.a { font-size: large; }')).toEqual([
      '1: font size outside tokens → "font-size: large"',
    ])
  })
})
