import grammar from './src/app/shj-css.js'
import { highlightHTML } from '@speed-highlight/core'

let pass = 0
let fail = 0
function eq(got, want, label) {
  if (got === want) {
    pass++
  } else {
    fail++
    console.log(`FAIL ${label}\n  got:  ${JSON.stringify(got)}\n  want: ${JSON.stringify(want)}`)
  }
}

const hl = (src) => highlightHTML(src, grammar, { block: false })

eq(await hl('h1{}'), '<span class="shj-syn-kwd">h1</span>{}', 'h1 entero')
eq(await hl('.box{}'), '<span class="shj-syn-class">.box</span>{}', 'clase')
eq(await hl('#main{}'), '<span class="shj-syn-type">#main</span>{}', 'id')
eq(await hl('h1 { color: red }'), '<span class="shj-syn-kwd">h1</span> { <span class="shj-syn-var">color</span>: red }', 'propiedad y valor plano')
eq(await hl('/* x */'), '<span class="shj-syn-cmnt">/* x */</span>', 'comentario')
eq(await hl('.a { margin: 0 }'), '<span class="shj-syn-class">.a</span> { <span class="shj-syn-var">margin</span>: <span class="shj-syn-num">0</span> }', 'numero con unidad vacía')

console.log(`\n${pass} pass, ${fail} fail`)
process.exit(fail ? 1 : 0)
