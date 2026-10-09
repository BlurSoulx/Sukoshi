import { expandHTML, looksLikeHTML } from './src/app/emmet-html.js'
import { expandCSS, looksLikeCSS } from './src/app/emmet-css.js'

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
function throws(fn, label) {
  try {
    fn()
    fail++
    console.log(`FAIL ${label} (no throw)`)
  } catch {
    pass++
  }
}

// --- HTML ---
eq(expandHTML('.box'), '<div class="box"></div>', 'class implícita')
eq(expandHTML('#main'), '<div id="main"></div>', 'id implícita')
eq(expandHTML('h1'), '<h1></h1>', 'tag solo')
eq(expandHTML('h1+hola'), '<h1></h1>\n<hola></hola>', 'custom elements valen')
eq(expandHTML('ul>li*3'), '<ul>\n  <li></li>\n  <li></li>\n  <li></li>\n</ul>', 'ul li x3')
eq(expandHTML('ul>.item$*3'), '<ul>\n  <li class="item1"></li>\n  <li class="item2"></li>\n  <li class="item3"></li>\n</ul>', 'numeración $')
eq(expandHTML('ul>li.item$$*2'), '<ul>\n  <li class="item01"></li>\n  <li class="item02"></li>\n</ul>', 'padding $$')
eq(expandHTML('div>p>span'), '<div>\n  <p><span></span></p>\n</div>', 'inline dentro de bloque')
eq(expandHTML('div>p^span'), '<div>\n  <p></p>\n</div>\n<span></span>', 'climb ^')
eq(expandHTML('p{hello}'), '<p>hello</p>', 'texto')
eq(expandHTML('a[href=url title=x]'), '<a href="url" title="x"></a>', 'attrs')
throws(() => expandHTML('input:checkbox'), 'dos puntos no soportado')
eq(expandHTML('img'), '<img>', 'void')
eq(expandHTML('br'), '<br>', 'void br')
eq(expandHTML('(div>p)*2'), '<div>\n  <p></p>\n</div>\n<div>\n  <p></p>\n</div>', 'grupo x2')
eq(expandHTML('lorem3'), '<div>Lorem ipsum dolor.</div>', 'lorem3')
eq(expandHTML('!').split('\n')[0], '<!DOCTYPE html>', 'boilerplate')
eq(looksLikeHTML('hello'), false, 'gate palabra')
eq(looksLikeHTML('div'), true, 'gate tag')
eq(looksLikeHTML('ul>li*2'), true, 'gate ops')
throws(() => expandHTML('div>'), 'trailing >')
throws(() => expandHTML('(div'), 'unbalanced')

// --- CSS ---
eq(expandCSS('m10'), 'margin: 10px;', 'm10')
eq(expandCSS('p10-20'), 'padding: 10px 20px;', 'p10-20')
eq(expandCSS('w100p'), 'width: 100%;', 'w100p')
eq(expandCSS('fz14'), 'font-size: 14px;', 'fz14')
eq(expandCSS('c#fff'), 'color: #fff;', 'color hex')
eq(expandCSS('d:f'), 'display: flex;', 'display flex')
eq(expandCSS('pos:a'), 'position: absolute;', 'pos')
eq(expandCSS('dib'), 'display: inline-block;', 'dib')
eq(expandCSS('op.5'), 'opacity: .5;', 'opacidad')
eq(expandCSS('z10'), 'z-index: 10;', 'zindex unitless')
eq(expandCSS('m10!'), 'margin: 10px !important;', 'important')
eq(expandCSS('lh1.5'), 'line-height: 1.5;', 'lh unitless')
eq(looksLikeCSS('red'), false, 'gate red')
eq(looksLikeCSS('m10'), true, 'gate m10')
throws(() => expandCSS('xyz'), 'unknown prop')

console.log(`\n${pass} pass, ${fail} fail`)
process.exit(fail ? 1 : 0)
