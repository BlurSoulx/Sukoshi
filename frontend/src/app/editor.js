import { activeDoc, setDirty, getExt } from './state.js'
import { highlightHTML, setLoader } from '@speed-highlight/core'

// Solo estos 3 lenguajes (el resto ni se empaqueta).
setLoader((n) => ({
  html: () => import('@speed-highlight/core/languages/html.js'),
  css: () => import('@speed-highlight/core/languages/css.js'),
  js: () => import('@speed-highlight/core/languages/js.js'),
})[n]?.())

const LANGS = { '.html': 'html', '.css': 'css', '.js': 'js' }

export function createEditor({ textarea, gutter = null, stage, pre, getLang = null, commit = null, detect = false }) {
  // Por defecto: lenguaje por extensión del doc activo y commit al estado.
  // Los panes del playground pasan su propio getLang/commit.
  const langOf = getLang ?? (() => LANGS[getExt()] ?? null)
  const commitValue = commit ?? ((v) => {
    activeDoc().content = v
    setDirty(true)
  })
  let raf = 0
  let lineCount = 1
  const activityCbs = []
  const fireActivity = () => activityCbs.forEach((cb) => { try { cb() } catch { /* listener roto */ } })

  // Altura explícita para que #stage haga scroll con ambos apilados.
  const autosize = () => {
    textarea.style.height = 'auto'
    textarea.style.height = Math.max(textarea.scrollHeight, stage.clientHeight) + 'px'
  }

  // Si el contenedor cambia por drag/colapso/restore/zoom, la altura en px
  // quedaría stale (scroll fantasma): se recalcula sola. No hay loop porque
  // el alto del textarea no cambia el tamaño del stage.
  try {
    new ResizeObserver(() => {
      autosize()
      scheduleRender()
    }).observe(stage)
  } catch { /* navegador sin ResizeObserver */ }

  // Resaltado solo del viewport (+margen), como mucho 1 vez por frame.
  // Sin lenguaje activo el pre pinta texto plano: costo ~cero.
  let renderQueued = false
  let renderId = 0
  let lastKey = ''
  const scheduleRender = () => {
    if (renderQueued) return
    renderQueued = true
    requestAnimationFrame(() => {
      renderQueued = false
      renderSlice()
    })
  }
  const positionPre = (first, lh) => {
    pre.style.transform = `translateY(${first * lh}px)`
  }
  async function renderSlice() {
    const lang = langOf()
    const v = textarea.value
    if (!lang) {
      lastKey = ''
      if (pre.textContent !== v) pre.textContent = v
      positionPre(0, 0)
      return
    }
    const lh = parseFloat(getComputedStyle(textarea).lineHeight) || 22
    const first = Math.max(0, Math.floor(stage.scrollTop / lh) - 40)
    const count = Math.ceil(stage.clientHeight / lh) + 80
    const last = Math.min(lineCount, first + count)
    const key = `${lang}:${first}:${last}:${lineCount}:${v.length}`
    positionPre(first, lh)
    if (key === lastKey) return
    lastKey = key
    const id = ++renderId
    const slice = v.split('\n').slice(first, last).join('\n')
    try {
      const html = await highlightHTML(slice, lang, { block: false })
      if (id !== renderId) return
      pre.innerHTML = html
    } catch {
      if (id === renderId) pre.textContent = slice
    }
  }

  const scheduleGutter = () => {
    if (raf) return
    raf = requestAnimationFrame(() => {
      raf = 0
      renderGutter()
      syncScroll()
    })
  }

  const countLines = () => {
    const v = textarea.value
    let n = 1
    for (let i = 0; i < v.length; i++) if (v[i] === '\n') n++
    return n
  }

  // Solo reconstruye el gutter si cambia el nº de líneas.
  // Evita crear un nodo por línea en cada input cuando el doc es grande.
  const renderGutter = () => {
    const n = countLines()
    lineCount = n
    if (!gutter) return
    // Ancho reservado en CSS hasta 4 dígitos: solo crece a partir de 10k líneas.
    const digits = String(n).length
    gutter.style.width = digits > 4 ? `calc(${digits}ch + 24px)` : ''
    if (gutter.childNodes.length === n && gutter._n === n) return
    gutter._n = n
    // textContent con saltos es 1 solo nodo: barato hasta 100k líneas.
    let s = ''
    for (let i = 1; i <= n; i++) s += i + '\n'
    gutter.textContent = s
  }

  const syncScroll = () => {
    if (gutter) gutter.scrollTop = stage.scrollTop
  }

  textarea.addEventListener('input', () => {
    commitValue(textarea.value)
    scheduleGutter()
    autosize()
    scheduleRender()
    if (detect) scheduleDetect()
    fireActivity()
  })
  // Cursor/selección también mueven el footer (Ln/Col), no solo el contenido.
  for (const ev of ['click', 'keyup', 'select']) {
    textarea.addEventListener(ev, fireActivity)
  }
  stage.addEventListener('scroll', () => {
    if (raf) return
    raf = requestAnimationFrame(() => {
      raf = 0
      syncScroll()
      scheduleRender()
    })
  }, { passive: true })

  // Snippets: palabra + Tab se expande (ver chuleta). Si no, 2 espacios.
  const SNIPPETS = {
    fecha: () => new Date().toISOString().slice(0, 10),
    hora: () => new Date().toTimeString().slice(0, 5),
    tabla: '| Col1 | Col2 |\n|---|---|\n|  |  |',
    lorem: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  }

  // Tab inserta 2 espacios para no perder el foco ni romper markdown.
  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Tab' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault()
      const { selectionStart: s, selectionEnd: en, value } = textarea
      if (s === en) {
        const m = value.slice(0, s).match(/([A-Za-záéíóúñü-]+)$/)
        const snip = m && SNIPPETS[m[1].toLowerCase()]
        if (snip) {
          const text = typeof snip === 'function' ? snip() : snip
          textarea.setRangeText(text, s - m[1].length, s, 'end')
          textarea.dispatchEvent(new Event('input', { bubbles: true }))
          return
        }
      }
      textarea.setRangeText('  ', s, en, 'end')
      textarea.dispatchEvent(new Event('input', { bubbles: true }))
    }
  })

  // Clic en un número selecciona su línea (solo editor principal).
  if (gutter) gutter.addEventListener('mousedown', (e) => {
    e.preventDefault()
    const lh = parseFloat(getComputedStyle(textarea).lineHeight) || 22
    const top = gutter.getBoundingClientRect().top + 4
    const line = Math.min(Math.max(1, Math.floor((e.clientY - top + gutter.scrollTop) / lh) + 1), lineCount)
    const v = textarea.value
    let off = 0
    for (let l = 1; l < line; l++) {
      const i = v.indexOf('\n', off)
      if (i < 0) { off = v.length; break }
      off = i + 1
    }
    const [ls] = lineBounds(off)
    const [, le] = lineBounds(off)
    textarea.focus()
    textarea.setSelectionRange(ls, le)
  })

  // Extensión inteligente: solo docs auto (untitled.* sin ruta), con
  // histéresis (solo sube txt→md→html, nunca baja solo). 1s tras escribir.
  let detectTimer = 0
  const scheduleDetect = () => {
    clearTimeout(detectTimer)
    detectTimer = setTimeout(detectExt, 1000)
  }
  function detectExt() {
    const d = activeDoc()
    if (d.filePath || !/^untitled(-\d+)?\.(txt|md|html)$/.test(d.fileName)) return
    const text = textarea.value.slice(0, 20000)
    let ext = '.txt'
    if (/<\s*(!doctype|html|head|body|div|span|p|h[1-6]|a|img|ul|ol|li|table|script|style|link|meta|title)[\s>/]/i.test(text)) {
      ext = '.html'
    } else if (/^#{1,6}\s/m.test(text) || /\*\*[^*\n]+\*\*/.test(text) || /\[.+?\]\(.+?\)/.test(text) || /^(\s*[-*+] |- \[[ x]\] |\d+[.)] |```|\|.*\|)/m.test(text)) {
      ext = '.md'
    }
    const rank = { '.txt': 0, '.md': 1, '.html': 2 }
    const cur = d.fileName.slice(d.fileName.lastIndexOf('.'))
    if ((rank[ext] ?? 0) > (rank[cur] ?? 0)) {
      d.fileName = d.fileName.slice(0, d.fileName.lastIndexOf('.')) + ext
      setDirty(d.dirty)
      scheduleRender()
    }
  }
  // Ajuste de línea persistido (números siguen siendo por línea lógica).
  let wrap = false
  try { wrap = localStorage.getItem('sukoshi-wrap') === '1' } catch { /* sin storage */ }
  const applyWrap = () => {
    textarea.wrap = wrap ? 'soft' : 'off'
    textarea.style.whiteSpace = wrap ? 'pre-wrap' : 'pre'
    pre.style.whiteSpace = wrap ? 'pre-wrap' : 'pre'
    autosize()
    scheduleRender()
  }
  applyWrap()

  const PAIRS = { '(': ')', '[': ']', '{': '}', '"': '"', "'": "'", '`': '`' }

  // Auto-cierre de pares y continuación de listas Markdown con Enter.
  textarea.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return
    const { selectionStart: s, selectionEnd: en, value } = textarea
    if (e.key === 'Backspace' && s === en && s > 0 && en < value.length) {
      const pair = value[s - 1] + value[s]
      if (pair === '()' || pair === '[]' || pair === '{}' || pair === '""' || pair === "''" || pair === '``') {
        e.preventDefault()
        textarea.setRangeText('', s - 1, s + 1, 'end')
        textarea.dispatchEvent(new Event('input', { bubbles: true }))
        return
      }
    }
    const closer = PAIRS[e.key]
    if (closer && s !== en) {
      // Con selección, envuelve: "texto" -> "(texto)".
      e.preventDefault()
      textarea.setRangeText(e.key + value.slice(s, en) + closer, s, en, 'select')
      textarea.dispatchEvent(new Event('input', { bubbles: true }))
      return
    }
    if (closer && s === en) {
      // Escribir el cierre sobre un cierre existente lo salta.
      if (value[s] === e.key && ')]}"\'`'.includes(e.key)) {
        e.preventDefault()
        textarea.setSelectionRange(s + 1, s + 1)
        return
      }
      // Comillas solo tras inicio/espacio/apertura para no romper don't.
      if ('"\'`'.includes(e.key) && s > 0 && !/[\s([{]/.test(value[s - 1])) return
      e.preventDefault()
      textarea.setRangeText(e.key + closer, s, en, 'end')
      textarea.setSelectionRange(s + 1, s + 1)
      textarea.dispatchEvent(new Event('input', { bubbles: true }))
      return
    }
    if (e.key === 'Enter') {
      // Enter entre {} [] () abre bloque con indent y cursor al medio.
      if (s === en && s > 0 && s < value.length) {
        const pair = value[s - 1] + value[s]
        if (pair === '{}' || pair === '[]' || pair === '()') {
          e.preventDefault()
          const ls0 = value.lastIndexOf('\n', s - 1) + 1
          const indent = (value.slice(ls0, s).match(/^\s*/) || [''])[0]
          textarea.setRangeText('\n' + indent + '  \n' + indent, s, s, 'end')
          const mid = s + 1 + indent.length + 2
          textarea.setSelectionRange(mid, mid)
          textarea.dispatchEvent(new Event('input', { bubbles: true }))
          return
        }
      }
      const ls = value.lastIndexOf('\n', s - 1) + 1
      const line = value.slice(ls, s)
      const rest = value.slice(s, value.indexOf('\n', s) < 0 ? value.length : value.indexOf('\n', s))
      const m = line.match(/^(\s*)(- \[( |x)\] |[-*+] |\d+[.)] )/)
      if (m && s === en) {
        e.preventDefault()
        if (rest.trim() === '') {
          // Línea con solo el marcador: Enter sale de la lista.
          textarea.setRangeText('', ls, s, 'end')
        } else {
          let marker = m[2]
          const num = m[2].match(/^(\d+)([.)]) $/)
          if (num) marker = `${+num[1] + 1}${num[2]} `
          if (/^- \[( |x)\] $/.test(marker)) marker = '- [ ] '
          textarea.setRangeText('\n' + m[1] + marker, s, en, 'end')
        }
        textarea.dispatchEvent(new Event('input', { bubbles: true }))
      }
    }
  })

  return {
    el: textarea,
    getValue: () => textarea.value,
    // setRaw: pinta sin tocar estado (carga inicial del playground).
    setRaw: (v) => {
      textarea.value = v ?? ''
      renderGutter()
      stage.scrollTop = 0
      syncScroll()
      autosize()
      scheduleRender()
      fireActivity()
    },
    setValue: (v) => {
      textarea.value = v ?? ''
      commitValue(textarea.value)
      renderGutter()
      stage.scrollTop = 0
      syncScroll()
      autosize()
      scheduleRender()
      fireActivity()
    },
    focus: () => textarea.focus(),
    onActivity: (cb) => { activityCbs.push(cb) },
    lineCount: () => lineCount,
    cursorOffset: () => textarea.selectionStart,
    selection: () => [textarea.selectionStart, textarea.selectionEnd],
    toggleWrap,
    refresh: () => {
      autosize()
      renderGutter()
      syncScroll()
      scheduleRender()
    },
    duplicateLines,
    moveLines,
    changeCase,
    joinLines,
    sortLines,
    formatTable,
    toggleWrapLines: () => {
      wrap = !wrap
      try { localStorage.setItem('sukoshi-wrap', wrap ? '1' : '0') } catch { /* sin storage */ }
      applyWrap()
      return wrap
    },
    wrapLines: () => wrap,
  }

  function lineBounds(off) {    const v = textarea.value
    const s = v.lastIndexOf('\n', off - 1) + 1
    let e = v.indexOf('\n', off)
    if (e < 0) e = v.length
    return [s, e]
  }

  function duplicateLines() {
    const { selectionStart: a, selectionEnd: b, value: v } = textarea
    const [s] = lineBounds(a)
    const [, e] = lineBounds(Math.max(b - 1, a))
    const block = v.slice(s, e)
    if (!block) return
    if (e < v.length) {
      textarea.setRangeText('\n' + block, e, e, 'end')
      const shift = block.length + 1
      textarea.setSelectionRange(a + shift, b + shift)
    } else {
      textarea.setRangeText('\n' + block, v.length, v.length, 'end')
      const shift = (e - s) + 1
      textarea.setSelectionRange(a + shift, b + shift)
    }
    textarea.dispatchEvent(new Event('input', { bubbles: true }))
  }

  function moveLines(dir) {
    const { selectionStart: a, selectionEnd: b, value: v } = textarea
    const [s] = lineBounds(a)
    const [, e] = lineBounds(Math.max(b - 1, a))
    const block = v.slice(s, e)
    if (dir < 0) {
      if (s === 0) return
      const ps = lineBounds(s - 1)[0]
      const prev = v.slice(ps, s - 1)
      textarea.setRangeText(block + '\n' + prev, ps, e, 'select')
      const anchor = a - (prev.length + 1)
      textarea.setSelectionRange(anchor, anchor + (b - a))
    } else {
      if (e === v.length) return
      const ne = lineBounds(e + 1)[1]
      const next = v.slice(e + 1, ne)
      textarea.setRangeText(next + '\n' + block, s, ne, 'select')
      const anchor = a + (next.length + 1)
      textarea.setSelectionRange(anchor, anchor + (b - a))
    }
    textarea.dispatchEvent(new Event('input', { bubbles: true }))
  }

  // Expande a líneas completas; sin selección usa la línea actual.
  function blockRange() {
    const { selectionStart: a, selectionEnd: b } = textarea
    if (b > a) {
      const [s] = lineBounds(a)
      const [, e] = lineBounds(Math.max(b - 1, a))
      return [s, e]
    }
    const [s] = lineBounds(a)
    const [, e] = lineBounds(a)
    return [s, e]
  }

  function changeCase(mode) {
    const { selectionStart: a, selectionEnd: b, value } = textarea
    const [s, e] = blockRange()
    const block = value.slice(s, e)
    if (!block) return
    const next = mode === 'upper' ? block.toUpperCase() : block.toLowerCase()
    if (next === block) return
    textarea.setRangeText(next, s, e, 'select')
    textarea.dispatchEvent(new Event('input', { bubbles: true }))
  }

  function joinLines() {
    const { value } = textarea
    const [s, e] = blockRange()
    const joined = value.slice(s, e).split('\n').map((l) => l.trim()).filter((l) => l !== '').join(' ')
    if (!joined || joined === value.slice(s, e)) return
    textarea.setRangeText(joined, s, e, 'select')
    textarea.dispatchEvent(new Event('input', { bubbles: true }))
  }

  function sortLines() {
    const { selectionStart: a, selectionEnd: b, value } = textarea
    if (b === a) return
    const [s, e] = blockRange()
    const lines = value.slice(s, e).split('\n')
    if (lines.length < 2) return
    const sorted = [...lines].sort((x, y) => x.localeCompare(y, 'es'))
    if (sorted.every((l, i) => l === lines[i])) return
    textarea.setRangeText(sorted.join('\n'), s, e, 'select')
    textarea.dispatchEvent(new Event('input', { bubbles: true }))
  }

  // Alinea la tabla Markdown bajo el cursor (ancho por columna + :---:/---:/:--:).
  function formatTable() {
    const { selectionStart: a, value } = textarea
    const lines = value.split('\n')
    let row = 0
    let off = 0
    for (; row < lines.length; row++) {
      if (off + lines[row].length >= a) break
      off += lines[row].length + 1
    }
    let top = row
    while (top > 0 && lines[top - 1].includes('|')) top--
    let bottom = row
    while (bottom + 1 < lines.length && lines[bottom + 1].includes('|')) bottom++
    const block = lines.slice(top, bottom + 1)
    if (block.length < 2 || !/^[\s|:~-]+$/.test(block[1]) || !block[1].includes('-')) return
    const cells = block.map((ln) => {
      let t = ln.trim()
      if (t.startsWith('|')) t = t.slice(1)
      if (t.endsWith('|')) t = t.slice(0, -1)
      return t.split('|').map((c) => c.trim())
    })
    const cols = Math.max(...cells.map((c) => c.length))
    const widths = []
    for (let c = 0; c < cols; c++) {
      widths.push(Math.max(3, ...cells.map((r) => (r[c] ?? '').length)))
    }
    const aligns = (cells[1] || []).map((c) => {
      const t = c.trim()
      if (t.startsWith(':') && t.endsWith(':')) return 'center'
      if (t.endsWith(':')) return 'right'
      return 'left'
    })
    const out = cells.map((r, i) => {
      const parts = []
      for (let c = 0; c < cols; c++) {
        if (i === 1) {
          const al = aligns[c] || 'left'
          parts.push(al === 'center' ? ':' + '-'.repeat(Math.max(1, widths[c] - 2)) + ':' : al === 'right' ? '-'.repeat(Math.max(1, widths[c] - 1)) + ':' : '-'.repeat(widths[c]))
        } else {
          parts.push((r[c] ?? '').padEnd(widths[c], ' '))
        }
      }
      return '| ' + parts.join(' | ') + ' |'
    })
    let start = 0
    for (let l = 0; l < top; l++) start += lines[l].length + 1
    let end = start
    for (let l = top; l <= bottom; l++) end += lines[l].length + 1
    textarea.setRangeText(out.join('\n'), start, value[end - 1] === '\n' ? end - 1 : end, 'select')
    textarea.dispatchEvent(new Event('input', { bubbles: true }))
  }

  function toggleWrap(prefix, suffix = prefix) {
    const { selectionStart: s, selectionEnd: e, value } = textarea
    const sel = value.slice(s, e)
    const before = value.slice(Math.max(0, s - prefix.length), s)
    const after = value.slice(e, e + suffix.length)
    let next, ns, ne
    if (before === prefix && after === suffix && sel.length >= 0) {
      // Quita formato: **hello** -> hello
      textarea.setRangeText(sel, s - prefix.length, e + suffix.length, 'select')
      next = textarea.value
      ns = s - prefix.length
      ne = ns + sel.length
    } else if (sel.length > 0) {
      textarea.setRangeText(prefix + sel + suffix, s, e, 'select')
      next = textarea.value
      ns = s + prefix.length
      ne = ns + sel.length
    } else {
      textarea.setRangeText(prefix + suffix, s, e, 'select')
      next = textarea.value
      ns = ne = s + prefix.length
    }
    textarea.focus()
    textarea.setSelectionRange(ns, ne)
    textarea.dispatchEvent(new Event('input', { bubbles: true }))
    return next
  }
}
