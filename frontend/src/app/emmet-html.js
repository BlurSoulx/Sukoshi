// Mini-Emmet HTML vanilla: subset práctico (. # > + ^ * $ @ () [] {} !,
// tags implícitos, lorem, void elements). Sin dependencias.
const VOID = new Set('area,base,br,col,embed,hr,img,input,link,meta,param,source,track,wbr'.split(','))
export const VOID_TAGS = VOID
const INLINE_TAGS = new Set('a,abbr,b,bdi,bdo,br,button,cite,code,dfn,em,i,kbd,label,mark,q,s,samp,script,select,small,span,strong,sub,sup,textarea,time,u,var'.split(','))
const IMPLICIT = {
  ul: 'li', ol: 'li', dl: 'dt', table: 'tr', tbody: 'tr', thead: 'tr', tfoot: 'tr',
  tr: 'td', colgroup: 'col', select: 'option', optgroup: 'option', datalist: 'option',
  frameset: 'frame', object: 'param', map: 'area',
}
const KNOWN = new Set('a,abbr,address,article,aside,audio,b,blockquote,body,br,button,canvas,caption,cite,code,col,colgroup,data,datalist,dd,del,details,dfn,dialog,div,dl,dt,em,embed,fieldset,figcaption,figure,footer,form,h1,h2,h3,h4,h5,h6,head,header,hgroup,hr,html,i,iframe,img,input,ins,kbd,label,legend,li,link,main,map,mark,meta,meter,nav,object,ol,optgroup,option,output,p,picture,pre,progress,q,s,samp,script,section,select,small,source,span,strong,style,sub,summary,sup,table,tbody,td,template,textarea,tfoot,th,thead,time,title,tr,track,u,ul,var,video'.split(','))
const LOREM_WORDS = 'lorem ipsum dolor sit amet consectetur adipisicing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum'.split(' ')

export function looksLikeHTML(abbr) {
  if (!abbr) return false
  return /[.#*+>^$@()[\]{}!|]/.test(abbr) || KNOWN.has(abbr.toLowerCase()) || /^lorem\d*$/i.test(abbr)
}

function loremGen(n, offset = 0) {
  const words = []
  for (let i = 0; i < n; i++) words.push(LOREM_WORDS[(offset + i) % LOREM_WORDS.length])
  return words.join(' ').replace(/^l/, 'L') + '.'
}

function subst(str, idx, total) {
  return str.replace(/(\$+)(@(-)?(\d*))?/g, (_, ds, at, rev, num) => {
    const w = ds.length
    let n
    if (!at) n = idx + 1
    else if (rev) n = num === '' ? total - idx : +num + (total - 1 - idx)
    else n = (num === '' ? 1 : +num) + idx
    return String(n).padStart(w, '0')
  })
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function skeleton() {
  return '<!DOCTYPE html>\n<html lang="es">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Document</title>\n</head>\n<body>\n  \n</body>\n</html>'
}

export function expandHTML(abbr, indent = '', contextTag = null) {
  if (abbr === '!') return skeleton()
  const p = { s: abbr, i: 0 }
  const root = { tag: 'root', children: [], parent: null }
  parseSiblings([root])
  if (p.i !== abbr.length) throw new Error('bad abbreviation')
  const out = root.children.map((c) => render(c, 0)).join('\n')
  if (!out) throw new Error('empty')
  return out.split('\n').map((l, i) => (i === 0 ? l : indent + l)).join('\n')

  function peek() {
    return p.i < p.s.length ? p.s[p.i] : ''
  }

  function parseSiblings(parents) {
    let currents = parseItem(parents)
    for (;;) {
      const c = peek()
      if (c === '+') {
        p.i++
        currents = parseItem(parents)
      } else if (c === '>') {
        p.i++
        parents = currents
        currents = parseItem(parents)
      } else if (c === '^') {
        let k = 0
        while (peek() === '^') {
          k++
          p.i++
        }
        parents = ascendAll(parents, k)
        currents = parseItem(parents)
      } else {
        return currents
      }
    }
  }

  function ascendAll(parents, k) {
    const out = []
    for (const n of parents) {
      let t = n
      for (let j = 0; j < k && t.parent; j++) t = t.parent
      if (!out.includes(t)) out.push(t)
    }
    return out.length ? out : [root]
  }

  function parseItem(parents) {
    let template
    if (peek() === '(') {
      p.i++
      const ghost = { tag: null, children: [], parent: null }
      parseSiblings([ghost])
      if (peek() !== ')') throw new Error('unbalanced')
      p.i++
      template = { group: ghost.children }
    } else {
      template = parseAtom()
    }
    let times = 1
    if (peek() === '*') {
      p.i++
      const m = /^\d+/.exec(p.s.slice(p.i))
      if (!m) throw new Error('bad repeat')
      times = +m[0]
      p.i += m[0].length
      if (times < 1 || times > 99) throw new Error('bad repeat')
    }
    const out = []
    for (let idx = 0; idx < times; idx++) {
      for (const par of parents) {
        if (template.group) {
          for (const kid of template.group) out.push(attachClone(kid, par, idx, times))
        } else {
          out.push(attachClone(template, par, idx, times))
        }
      }
    }
    return out
  }

  function parseAtom() {
    const node = { tag: null, id: null, classes: [], attrs: [], text: null, children: [], parent: null }
    const m = /^[a-zA-Z][a-zA-Z0-9-]*/.exec(p.s.slice(p.i))
    if (m) {
      p.i += m[0].length
      const lm = /^lorem(\d*)$/i.exec(m[0])
      if (lm) {
        node.lorem = lm[1] === '' ? 30 : +lm[1]
      } else {
        node.tag = m[0]
      }
    } else if (peek() === '' || !'.#[{'.includes(peek())) {
      throw new Error('expected tag')
    }
    for (;;) {
      const c = peek()
      if (c === '.') {
        p.i++
        node.classes.push(parseName())
      } else if (c === '#') {
        p.i++
        if (node.id) throw new Error('double id')
        node.id = parseName()
      } else if (c === '[') {
        p.i++
        parseAttrs(node)
      } else if (c === '{') {
        p.i++
        const end = p.s.indexOf('}', p.i)
        if (end < 0) throw new Error('unbalanced')
        node.text = p.s.slice(p.i, end)
        p.i = end + 1
      } else {
        break
      }
    }
    return node
  }

  function parseName() {
    const m = /^[a-zA-Z0-9-_@$]+/.exec(p.s.slice(p.i))
    if (!m) throw new Error('expected name')
    p.i += m[0].length
    return m[0]
  }

  function parseAttrs(node) {
    for (;;) {
      while (peek() === ' ') p.i++
      if (peek() === ']') {
        p.i++
        return
      }
      const km = /^[a-zA-Z0-9-_.:]+/.exec(p.s.slice(p.i))
      if (!km) throw new Error('bad attr')
      p.i += km[0].length
      let val = null
      while (peek() === ' ') p.i++
      if (peek() === '=') {
        p.i++
        while (peek() === ' ') p.i++
        const q = peek()
        if (q === '"' || q === "'") {
          p.i++
          const end = p.s.indexOf(q, p.i)
          if (end < 0) throw new Error('unbalanced')
          val = p.s.slice(p.i, end)
          p.i = end + 1
        } else {
          const vm = /^[^\s\]]+/.exec(p.s.slice(p.i))
          if (!vm) throw new Error('bad value')
          val = vm[0]
          p.i += val.length
        }
      }
      node.attrs.push([km[0], val])
    }
  }

  function attachClone(t, par, idx, total) {
    const parentTag = par.tag === 'root' ? contextTag : par.tag
    const n = {
      tag: t.tag,
      id: t.id == null ? null : subst(t.id, idx, total),
      classes: t.classes.map((c) => subst(c, idx, total)),
      attrs: t.attrs.map(([k, v]) => [subst(k, idx, total), v == null ? null : subst(v, idx, total)]),
      text: null,
      children: [],
      parent: par,
    }
    if (t.lorem != null) {
      n.text = loremGen(t.lorem, idx * 7)
    } else if (t.text != null) {
      n.text = subst(t.text, idx, total)
    }
    if (n.tag == null) {
      n.tag = (parentTag && IMPLICIT[parentTag.toLowerCase()]) || (parentTag && INLINE_TAGS.has(parentTag.toLowerCase()) ? 'span' : 'div')
    }
    par.children.push(n)
    for (const kid of t.children || []) {
      const c = attachClone(kid, n, idx, total)
      void c
    }
    return n
  }

  function renderAttrs(n) {
    let s = ''
    if (n.id) s += ` id="${esc(n.id)}"`
    if (n.classes.length) s += ` class="${esc(n.classes.join(' '))}"`
    for (const [k, v] of n.attrs) s += v == null ? ` ${k}` : ` ${k}="${esc(v)}"`
    return s
  }

  function render(n, level) {
    const pad = '  '.repeat(level)
    const attrs = renderAttrs(n)
    if (VOID.has(n.tag.toLowerCase())) return `${pad}<${n.tag}${attrs}>`
    const kids = n.children
    if (!kids.length && n.text == null) return `${pad}<${n.tag}${attrs}></${n.tag}>`
    if (!kids.length) return `${pad}<${n.tag}${attrs}>${esc(n.text)}</${n.tag}>`
    const inlineKids = kids.every((k) => INLINE_TAGS.has(k.tag.toLowerCase()))
    if (n.text == null && inlineKids) {
      return `${pad}<${n.tag}${attrs}>${kids.map((k) => render(k, 0)).join('')}</${n.tag}>`
    }
    let s = `${pad}<${n.tag}${attrs}>`
    if (n.text != null) s += esc(n.text)
    for (const k of kids) s += '\n' + render(k, level + 1)
    return s + `\n${pad}</${n.tag}>`
  }
}
