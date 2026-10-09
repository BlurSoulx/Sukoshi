// Gramática CSS propia para speed-highlight (solo el motor es de la lib).
// Corrige la incluida: tags con dígitos (h1), colores con nombre (red) y
// el catch-all que pintaba cualquier palabra como número.
export default [
  { match: /\/\*[\s\S]*?(\*\/|$)/g, type: 'cmnt' },
  { expand: 'str' },
  { type: 'num', match: /#(?:[\da-f]{8}|[\da-f]{6}|[\da-f]{3,4})/gi },
  { type: 'type', match: /#[a-zA-Z_][\w-]*/g },
  { type: 'class', match: /\.[a-zA-Z_-][\w-]*/g },
  { type: 'kwd', match: /(?<![\w.#:])([a-zA-Z][\w-]*)(?=[^{}]*\{)/g },
  { type: 'var', match: /\b[\w-]+(?=\s*:)/g },
  { type: 'kwd', match: /@[\w-]+\b|!important\b/g },
  { match: /url\([^)]*\)/g, sub: [{ type: 'func', match: /url(?=\()/g }, { type: 'str', match: /[^()]+/g }] },
  { type: 'func', match: /\b[a-zA-Z][\w-]*(?=\s*\()/g },
  { type: 'num', match: /-?\d*\.?\d+([a-z]+|%)?/gi, sub: [{ type: 'var', match: /[a-z]+|%/gi }] },
]
