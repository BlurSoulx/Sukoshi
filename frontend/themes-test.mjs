import { THEMES } from './src/app/themes.js'

const UI = ['bg', 'fg', 'gutter', 'selection', 'scrollbar', 'scrollbarHover', 'searchBg', 'accent', 'previewBg', 'previewFg']
const CODE = ['kwd', 'str', 'cmnt', 'num', 'func', 'oper', 'var', 'cls', 'type', 'bool', 'section', 'deleted', 'insert', 'err']
const HEX = /^#[0-9a-f]{6}$/i
let fail = 0
const ids = new Set()
for (const t of THEMES) {
  if (ids.has(t.id)) {
    fail++
    console.log(`FAIL id duplicado: ${t.id}`)
  }
  ids.add(t.id)
  if (t.mode !== 'dark' && t.mode !== 'light') {
    fail++
    console.log(`FAIL modo inválido en ${t.id}`)
  }
  for (const k of UI) {
    if (!HEX.test(t.ui?.[k] ?? '')) {
      fail++
      console.log(`FAIL ui.${k} inválido en ${t.id}: ${t.ui?.[k]}`)
    }
  }
  for (const k of CODE) {
    if (!HEX.test(t.code?.[k] ?? '')) {
      fail++
      console.log(`FAIL code.${k} inválido en ${t.id}: ${t.code?.[k]}`)
    }
  }
}
console.log(`${THEMES.length} paletas, ${fail ? fail + ' fallos' : 'todo válido'}`)
process.exit(fail ? 1 : 0)
