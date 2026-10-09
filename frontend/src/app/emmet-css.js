// Mini-Emmet CSS vanilla: mapa compacto + inferencia de unidades.
// Formas: m10, p10-20, w100p, fz14, c#fff, d:f, pos:a, dib, op.5, z10, m10!
const NUMERIC = {
  m: 'margin', mt: 'margin-top', mr: 'margin-right', mb: 'margin-bottom', ml: 'margin-left',
  p: 'padding', pt: 'padding-top', pr: 'padding-right', pb: 'padding-bottom', pl: 'padding-left',
  w: 'width', h: 'height', mw: 'min-width', mh: 'min-height',
  fz: 'font-size', fw: 'font-weight', lh: 'line-height',
  c: 'color', bgc: 'background-color', bg: 'background',
  brad: 'border-radius', bxsh: 'box-shadow', tsh: 'text-shadow',
  t: 'top', r: 'right', b: 'bottom', l: 'left',
  gap: 'gap', rg: 'row-gap', cg: 'column-gap',
  z: 'z-index', op: 'opacity', fx: 'flex', fg: 'flex-grow', order: 'order',
}
const EXACT = {
  'd:b': ['display', 'block'], 'd:n': ['display', 'none'], 'd:f': ['display', 'flex'],
  'd:i': ['display', 'inline'], 'd:ib': ['display', 'inline-block'], 'd:g': ['display', 'grid'],
  dib: ['display', 'inline-block'], df: ['display', 'flex'],
  'pos:a': ['position', 'absolute'], 'pos:r': ['position', 'relative'],
  'pos:f': ['position', 'fixed'], 'pos:s': ['position', 'static'],
  'fl:l': ['float', 'left'], 'fl:r': ['float', 'right'], 'fl:n': ['float', 'none'],
  'cl:l': ['clear', 'left'], 'cl:r': ['clear', 'right'], 'cl:b': ['clear', 'both'], 'cl:n': ['clear', 'none'],
  'ta:l': ['text-align', 'left'], 'ta:c': ['text-align', 'center'],
  'ta:r': ['text-align', 'right'], 'ta:j': ['text-align', 'justify'],
  'td:n': ['text-decoration', 'none'], 'td:u': ['text-decoration', 'underline'],
  'tt:u': ['text-transform', 'uppercase'], 'tt:l': ['text-transform', 'lowercase'],
  'tt:c': ['text-transform', 'capitalize'], 'tt:n': ['text-transform', 'none'],
  'ov:h': ['overflow', 'hidden'], 'ov:a': ['overflow', 'auto'], 'ov:s': ['overflow', 'scroll'],
  'cur:p': ['cursor', 'pointer'], 'cur:d': ['cursor', 'default'],
  'fs:i': ['font-style', 'italic'], 'fs:n': ['font-style', 'normal'],
  fwb: ['font-weight', 'bold'], fwn: ['font-weight', 'normal'],
  'va:t': ['vertical-align', 'top'], 'va:m': ['vertical-align', 'middle'], 'va:b': ['vertical-align', 'bottom'],
  'lis:n': ['list-style', 'none'], 'whs:n': ['white-space', 'nowrap'],
  bdn: ['border', 'none'],
}
const UNITLESS = new Set(['z-index', 'opacity', 'font-weight', 'flex', 'flex-grow', 'order', 'line-height'])
const NUMKEYS = Object.keys(NUMERIC).sort((a, b) => b.length - a.length)

export function looksLikeCSS(s) {
  if (!s) return false
  try {
    expandCSS(s)
    return true
  } catch {
    return false
  }
}

export function expandCSS(abbr) {
  let important = false
  let s = abbr
  if (s.endsWith('!')) {
    important = true
    s = s.slice(0, -1)
  }
  const imp = important ? ' !important' : ''
  if (EXACT[s] !== undefined) {
    const [prop, val] = EXACT[s]
    return `${prop}: ${val}${imp};`
  }
  for (const k of NUMKEYS) {
    if (s === k || s.startsWith(k)) {
      const rest = s.slice(k.length)
      // El valor debe empezar por número/#/ premium ./- para no tragar palabras
      // normales (p. ej. `red` no es `right: ed`).
      if (!rest || !/^[+-]?[\d.#]/.test(rest)) continue
      return `${NUMERIC[k]}: ${cssValue(NUMERIC[k], rest)}${imp};`
    }
  }
  throw new Error('unknown')
}

function cssValue(prop, raw) {
  const parts = raw.split(/(?<!^)-/)
  return parts.map((pt) => oneValue(prop, pt)).join(' ')
}

function oneValue(prop, pt) {
  if (!pt) throw new Error('bad value')
  const m = /^([+-]?(?:\d+\.?\d*|\.\d+))(p|e|r|x|ch|vw|vh|%|s|ms|pt|pc|in|cm|mm|q)?$/i.exec(pt)
  if (m) {
    const u = (m[2] || '').toLowerCase()
    const unit = u === 'p' ? '%' : u === 'e' ? 'em' : u === 'r' ? 'rem' : u === 'x' ? 'ex' : u
    return m[1] + (unit || (UNITLESS.has(prop) ? '' : 'px'))
  }
  if (/^#([0-9a-f]{3,8})$/i.test(pt)) return pt
  if (/^[a-z-]+$/i.test(pt)) return pt
  throw new Error('bad value')
}
