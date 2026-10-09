import { createEditor } from './editor.js'
import { initConsole } from './play-console.js'
import { iconSVG } from './icons.js'
import { currentTheme, getSetting } from './settings.js'
import { t, getLang } from './i18n.js'

// El fondo del preview sigue al tema en tiempo real.
document.addEventListener('sukoshi:theme', () => {
  renderPreview()
})
import { VOID_TAGS } from './emmet-html.js'

// Playground web: 3 buffers (HTML/CSS/JS) + preview en vivo en iframe
// sandboxed (sin acceso a los bindings de Go). No toca docs ni pestañas.
const BUFFERS = { html: '', css: '', js: '' }
const KEY = (l) => `sukoshi-play-${l}`
const PREFS_KEY = 'sukoshi-play-prefs'
const VIEWPORTS = [null, 768, 390]
const ZOOMS = [0.5, 0.67, 0.8, 1, 1.25, 1.5]
const prefs = { viewport: 0, paused: false, solo: false, zoom: 1, wrap: false }
let panes = null
let previewTimer = 0

function loadBuffers() {
  for (const l of Object.keys(BUFFERS)) {
    try {
      BUFFERS[l] = localStorage.getItem(KEY(l)) ?? ''
    } catch {
      BUFFERS[l] = ''
    }
  }
  // Migración única: quita el ejemplo inicial viejo si nunca se editó.
  if (BUFFERS.html === '<h1>Hola</h1>\n<p>Escribe HTML, CSS y JS…</p>\n') {
    BUFFERS.html = ''
    saveBuffer('html')
  }
}

function saveBuffer(l) {
  try {
    localStorage.setItem(KEY(l), BUFFERS[l])
  } catch { /* sin storage */ }
}

function schedulePreview() {
  if (prefs.paused) return
  clearTimeout(previewTimer)
  previewTimer = setTimeout(renderPreview, 200)
}

const SHIM = '<script>(function(){function fmt(x){try{return typeof x==="string"?x.slice(0,500):JSON.stringify(x).slice(0,500)}catch(e){return String(x).slice(0,500)}}function send(t,a){try{parent.postMessage({__sukoshi_console:1,type:t,args:a.slice(0,8).map(fmt)},"*")}catch(e){}}["log","info","warn","error"].forEach(function(k){var o=console[k].bind(console);console[k]=function(){o.apply(null,arguments);send(k,Array.prototype.slice.call(arguments))}});window.addEventListener("error",function(e){send("error",[e.message||"error"])});window.addEventListener("message",function(e){var d=e.data||{};if(!d.__sukoshi_eval)return;var r;try{r=(0,eval)(d.code)}catch(err){e.source.postMessage({__sukoshi_result:1,id:d.id,ok:false,value:String((err&&err.stack)||err)},"*");return}try{e.source.postMessage({__sukoshi_result:1,id:d.id,ok:true,value:fmt(r)},"*")}catch(err){e.source.postMessage({__sukoshi_result:1,id:d.id,ok:false,value:String(err)},"*")}})})();<\/script>'

function renderPreview() {
  const frame = document.getElementById('play-preview')
  if (!frame || document.getElementById('play').hidden) return
  applyViewport()
  validateAll()
  frame.srcdoc = buildSrcdoc()
}

export function buildSrcdoc() {
  const { pre, js } = srcdocParts()
  return `${pre}${js}<\/script></body></html>`
}

function srcdocParts() {
  const t = currentTheme()
  const themed = getSetting('themedPreview') !== false
  const bg = themed ? t.ui.previewBg : t.mode === 'light' ? '#ffffff' : '#141414'
  const fg = themed ? t.ui.previewFg : t.mode === 'light' ? '#111111' : '#e5e5e5'
  const base = `body{background:${bg};color:${fg}}a{color:${t.ui.accent}}`
  const js = BUFFERS.js.replace(/<\/script/gi, '<\\/script')
  const pre = `<!DOCTYPE html><html><head><meta charset="utf-8">${SHIM}<style>${base}${BUFFERS.css}</style></head><body>${BUFFERS.html}<script>`
  return { pre, js }
}

// Validador liviano de los 3: tags HTML, llaves CSS y sintaxis JS
// (new Function parsea sin ejecutar). Un punto por pane con su mensaje.
function setPaneErr(lang, msg) {
  const el = document.getElementById(`play-err-${lang}`)
  if (!el) return
  el.hidden = !msg
  if (msg) {
    el.textContent = '●'
    el.title = msg
  }
}

function validateAll() {
  let htmlErr = null
  const src = BUFFERS.html.replace(/<!--[\s\S]*?-->/g, '')
  const stack = []
  const re = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)\b[^>]*?(\/?)>/g
  let m
  while ((m = re.exec(src))) {
    const tag = m[2].toLowerCase()
    if (VOID_TAGS.has(tag) || m[3] || tag[0] === '!' || tag[0] === '?') continue
    if (m[1]) {
      const ix = stack.lastIndexOf(tag)
      if (ix < 0 && !htmlErr) htmlErr = `${t('play.errUnclosed')}: ${tag}`
      else if (ix >= 0) stack.length = ix
    } else {
      stack.push(tag)
    }
  }
  if (!htmlErr && stack.length) htmlErr = `${t('play.errOpen')}: ${stack[stack.length - 1]}`
  setPaneErr('html', htmlErr)

  let cssErr = null
  const css = BUFFERS.css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/"[^"\n]*"|'[^'\n]*'/g, '')
  let depth = 0
  for (const ch of css) {
    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth < 0) {
        cssErr = t('play.errExtra')
        depth = 0
      }
    }
  }
  if (!cssErr && depth > 0) cssErr = t('play.errBrace')
  setPaneErr('css', cssErr)

  let jsErr = null
  if (BUFFERS.js.trim()) {
    try {
      new Function(BUFFERS.js)
    } catch (e) {
      jsErr = String(e.message).split('\n')[0]
    }
  }
  setPaneErr('js', jsErr)
}

const LAYOUT_KEY = 'sukoshi-play-layout-v2'
const ORDER = ['html', 'css', 'js']
const MODES = ['left', 'right', 'top', 'bottom']
const layout = { mode: 'left', slots: {} }

function slot() {
  layout.slots[layout.mode] ??= {}
  return layout.slots[layout.mode]
}

function loadLayout() {
  try {
    const L = JSON.parse(localStorage.getItem(LAYOUT_KEY)) ?? null
    if (L && MODES.includes(L.mode)) layout.mode = L.mode
    if (L && L.slots) layout.slots = L.slots
  } catch { /* sin storage */ }
}

function saveLayout() {
  try {
    const els = [...document.querySelectorAll('.play-pane')]
    const s = slot()
    const row = layout.mode === 'top' || layout.mode === 'bottom'
    s.h = els.map((p) => Math.round(row ? p.getBoundingClientRect().width : p.getBoundingClientRect().height))
    s.c = els.map((p) => p.classList.contains('collapsed'))
    const m = document.getElementById('play-preview')?.style.flex.match(/0 0 ([\d.]+)px/)
    s.pv = m ? +m[1] : 0
    localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout))
  } catch { /* sin storage */ }
}

function applyLayout() {
  const root = document.getElementById('play')
  for (const m of MODES) root.classList.remove('layout-' + m)
  root.classList.add('layout-' + layout.mode)
  const s = slot()
  const els = [...document.querySelectorAll('.play-pane')]
  els.forEach((p, i) => {
    if (s.c?.[i]) {
      p.classList.add('collapsed')
      p.style.flex = ''
    } else {
      p.classList.remove('collapsed')
      if (s.h?.[i] > 0) {
        p.style.flex = `0 0 ${s.h[i]}px`
        p.dataset.h = p.style.flex
      } else {
        p.style.flex = ''
      }
    }
  })
  const pv = document.getElementById('play-preview')
  if (pv) pv.style.flex = s.pv > 0 ? `0 0 ${s.pv}px` : ''
}

export function cycleLayout() {
  saveLayout()
  layout.mode = MODES[(MODES.indexOf(layout.mode) + 1) % MODES.length]
  applyLayout()
  saveLayout()
}

// Primitivas para el menú overflow de la playbar (lee prefs en vivo).
export function playPrefs() {
  return { ...prefs }
}

export function togglePlayPause() {
  prefs.paused = !prefs.paused
  savePrefs()
  if (!prefs.paused) renderPreview()
}

export function cyclePlayViewport() {
  prefs.viewport = (prefs.viewport + 1) % VIEWPORTS.length
  savePrefs()
  applyViewport()
}

export function togglePlaySolo() {
  prefs.solo = !prefs.solo
  savePrefs()
  document.body.classList.toggle('solo', prefs.solo)
}

// Zoom del preview (la rueda no llega: el iframe se come los eventos).
export function cyclePlayZoom() {
  const i = nearestZoom(prefs.zoom)
  prefs.zoom = ZOOMS[(i + 1) % ZOOMS.length]
  savePrefs()
  applyZoom()
}

export function zoomPlayBy(d) {
  const i = nearestZoom(prefs.zoom)
  const n = Math.min(ZOOMS.length - 1, Math.max(0, i + d))
  if (ZOOMS[n] === prefs.zoom) return
  prefs.zoom = ZOOMS[n]
  savePrefs()
  applyZoom()
}

export function resetPlayZoom() {
  if (prefs.zoom === 1) return
  prefs.zoom = 1
  savePrefs()
  applyZoom()
}

function nearestZoom(z) {
  let best = 0
  for (let i = 1; i < ZOOMS.length; i++) {
    if (Math.abs(ZOOMS[i] - z) < Math.abs(ZOOMS[best] - z)) best = i
  }
  return best
}

function applyZoom() {
  const frame = document.getElementById('play-preview')
  if (!frame) return
  frame.style.zoom = prefs.zoom === 1 ? '' : String(prefs.zoom)
}

// Ajuste de línea de los 3 panes (persistido en prefs del playground).
export function togglePlayWrap() {
  if (!panes) return false
  prefs.wrap = !prefs.wrap
  savePrefs()
  for (const l of ORDER) panes[l]?.setWrap(prefs.wrap)
  return prefs.wrap
}

export function rerunPreview() {
  renderPreview()
}

function togglePane(pane) {
  const els = [...document.querySelectorAll('.play-pane')]
  // El flex inline del arrastre le ganaría a .collapsed: se guarda y se limpia.
  if (pane.classList.contains('collapsed')) {
    pane.classList.remove('collapsed')
    if (pane.dataset.h) pane.style.flex = pane.dataset.h
  } else {
    pane.dataset.h = pane.style.flex || ''
    pane.style.flex = ''
    pane.classList.add('collapsed')
  }
  saveLayout()
  panes[ORDER[els.indexOf(pane)]]?.refresh()
}

function wireLayout() {
  document.querySelectorAll('.play-pane > header').forEach((h) => {
    const els = [...document.querySelectorAll('.play-pane')]
    const pane = h.parentElement
    const lang = ORDER[els.indexOf(pane)]
    h.addEventListener('click', () => panes[lang]?.el.focus())
    h.addEventListener('dblclick', () => togglePane(pane))
  })
  document.querySelectorAll('#play-editors .play-div').forEach((div) => {
    // Doble clic colapsa/restaura el panel de arriba.
    div.addEventListener('dblclick', () => {
      const els = [...document.querySelectorAll('.play-pane')]
      const pane = els[+div.dataset.i]
      if (pane) togglePane(pane)
    })
    div.addEventListener('mousedown', (e) => {
      e.preventDefault()
      const els = [...document.querySelectorAll('.play-pane')]
      const a = els[+div.dataset.i]
      const b = els[+div.dataset.i + 1]
      if (!a || !b || a.classList.contains('collapsed') || b.classList.contains('collapsed')) return
      // En fila se reparten anchos, en columna altos.
      const row = layout.mode === 'top' || layout.mode === 'bottom'
      const MIN = row ? 140 : 60
      const size = (el) => Math.round(row ? el.getBoundingClientRect().width : el.getBoundingClientRect().height)
      const p0 = row ? e.clientX : e.clientY
      const ha = size(a)
      const hb = size(b)
      const total = ha + hb
      // Suma constante: lo que crece uno lo pierde el otro; el tercero ni se mueve.
      if (total <= MIN * 2) return
      const move = (ev) => {
        const na = Math.min(Math.max(MIN, ha + ((row ? ev.clientX : ev.clientY) - p0)), total - MIN)
        a.style.flex = `0 0 ${na}px`
        b.style.flex = `0 0 ${total - na}px`
      }
      const up = () => {
        document.removeEventListener('mousemove', move)
        document.removeEventListener('mouseup', up)
        dropShield()
        saveLayout()
      }
      dragShield(layout.mode === 'top' || layout.mode === 'bottom' ? 'x' : 'y')
      document.addEventListener('mousemove', move)
      document.addEventListener('mouseup', up)
    })
  })
  // Si la ventana encoge y los fijos desbordan, se vuelve al reparto.
  // Si crece, se escala proporcional para no dejar hueco muerto.
  let lastBox = 0
  window.addEventListener('resize', () => {
    const box = document.getElementById('play-editors')
    if (!box || document.getElementById('play').hidden) return
    const row = layout.mode === 'top' || layout.mode === 'bottom'
    const size = row ? box.clientWidth : box.clientHeight
    if (!size) return
    const panes = [...document.querySelectorAll('.play-pane')].filter((p) => !p.classList.contains('collapsed'))
    const each = (p) => row ? p.getBoundingClientRect().width : p.getBoundingClientRect().height
    const sum = panes.reduce((t, p) => t + each(p), 0)
    if (sum > size + 1) {
      panes.forEach((p) => { p.style.flex = '' })
      saveLayout()
    } else if (lastBox && size !== lastBox) {
      const ratio = size / lastBox
      panes.forEach((p) => {
        const m = p.style.flex.match(/0 0 ([\d.]+)px/)
        if (m) p.style.flex = `0 0 ${Math.max(row ? 140 : 60, +m[1] * ratio)}px`
      })
    }
    lastBox = size
  })
}

function loadPrefs() {
  try {
    Object.assign(prefs, JSON.parse(localStorage.getItem(PREFS_KEY)) ?? {})
  } catch { /* sin storage */ }
  if (!VIEWPORTS.includes(prefs.viewport)) prefs.viewport = 0
  prefs.paused = !!prefs.paused
  prefs.solo = !!prefs.solo
  if (!ZOOMS.includes(prefs.zoom)) prefs.zoom = 1
  prefs.wrap = !!prefs.wrap
  delete prefs.theme
}

function savePrefs() {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
  } catch { /* sin storage */ }
}

// Carga contenido externo en un pane (drop de archivos).
export function loadInto(lang, content) {
  if (!BUFFERS.hasOwnProperty(lang) || !panes) return false
  BUFFERS[lang] = content
  saveBuffer(lang)
  panes[lang].setRaw(content)
  schedulePreview()
  return true
}

const TEMPLATES = {
  blank: { html: '', css: '', js: '' },
  card: {
    get html() { return getLang() === 'en' ? '<div class="card">\n  <h1>Title</h1>\n  <p>Some text…</p>\n  <button>Hello</button>\n</div>' : '<div class="card">\n  <h1>Título</h1>\n  <p>Texto…</p>\n  <button>Hola</button>\n</div>' },
    css: 'body {\n  min-height: 100vh;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  margin: 0;\n}\n.card {\n  padding: 24px 32px;\n  border: 1px solid #333;\n  border-radius: 12px;\n  text-align: center;\n}\nbutton {\n  padding: 8px 16px;\n  cursor: pointer;\n}',
    get js() { return getLang() === 'en' ? "document.querySelector('button').addEventListener('click', () => {\n  console.log('click!');\n});" : "document.querySelector('button').addEventListener('click', () => {\n  console.log('¡clic!');\n});" },
  },
  grid: {
    html: '<div class="grid">\n  <div>1</div>\n  <div>2</div>\n  <div>3</div>\n  <div>4</div>\n  <div>5</div>\n  <div>6</div>\n</div>',
    css: '.grid {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  gap: 12px;\n}\n.grid div {\n  padding: 24px;\n  border: 1px solid #333;\n  border-radius: 8px;\n  text-align: center;\n}',
    js: '',
  },
}

export function templateNames() {
  return [
    { id: 'blank', name: t('play.tplBlank') },
    { id: 'card', name: t('play.tplCard') },
    { id: 'grid', name: t('play.tplGrid') },
  ]
}

export function applyTemplate(id) {
  const t = TEMPLATES[id]
  if (!t || !panes) return false
  for (const l of ORDER) {
    BUFFERS[l] = t[l]
    saveBuffer(l)
    panes[l].setRaw(t[l])
  }
  schedulePreview()
  return true
}

export function buffersEmpty() {
  return !BUFFERS.html && !BUFFERS.css && !BUFFERS.js
}

export function getBuffers() {
  return { ...BUFFERS }
}

function applyViewport() {
  const frame = document.getElementById('play-preview')
  if (!frame) return
  const w = VIEWPORTS[prefs.viewport]
  if (!w) {
    frame.style.width = ''
    frame.style.margin = ''
  } else {
    frame.style.width = `${w}px`
    frame.style.margin = '0 auto'
  }
}

function fitEditors() {
  const box = document.getElementById('play-editors')
  if (!box) return
  const row = layout.mode === 'top' || layout.mode === 'bottom'
  const over = row ? box.scrollWidth > box.clientWidth + 1 : box.scrollHeight > box.clientHeight + 1
  if (over) {
    box.querySelectorAll('.play-pane').forEach((p) => { p.style.flex = '' })
    saveLayout()
  }
}

// Divisor del preview: ambos lados con mínimo para que ninguno desaparezca.
// Escudo anti-iframe/selección durante arrastres.
function dragShield(axis) {
  document.body.classList.add('dragging')
  document.body.style.cursor = axis === 'x' ? 'col-resize' : 'row-resize'
}

function dropShield() {
  document.body.classList.remove('dragging')
  document.body.style.cursor = ''
}

function wirePreviewDiv() {
  const div = document.getElementById('play-div-main')
  if (!div) return
  div.addEventListener('mousedown', (e) => {
    e.preventDefault()
    const editors = document.getElementById('play-editors')
    const preview = document.getElementById('play-preview')
    if (!editors || !preview) return
    const row = layout.mode === 'left' || layout.mode === 'right'
    const MIN = 200
    const box = document.getElementById('play-main').getBoundingClientRect()
    const total = Math.round(row ? box.width : box.height)
    const pr = preview.getBoundingClientRect()
    const pv0 = Math.round(row ? pr.width : pr.height)
    const p0 = row ? e.clientX : e.clientY
    // Izq/arriba: arrastrar agranda editores (preview se achica) y viceversa.
    const sgn = layout.mode === 'left' || layout.mode === 'top' ? -1 : 1
    if (total <= MIN * 2) return
    const move = (ev) => {
      const d = (row ? ev.clientX : ev.clientY) - p0
      const pv = Math.min(Math.max(MIN, pv0 + sgn * d), total - MIN)
      preview.style.flex = `0 0 ${pv}px`
    }
    const up = () => {
      document.removeEventListener('mousemove', move)
      document.removeEventListener('mouseup', up)
      dropShield()
      fitEditors()
      saveLayout()
    }
    dragShield(row ? 'x' : 'y')
    document.addEventListener('mousemove', move)
    document.addEventListener('mouseup', up)
  })
  // Doble clic: mitad perfecta.
  div.addEventListener('dblclick', () => {
    const preview = document.getElementById('play-preview')
    if (preview) preview.style.flex = ''
    fitEditors()
    saveLayout()
  })
}

export function initPlay() {
  return ensurePlay()
}

// El playground se inicializa al primer uso (3 editores + observers fuera
// del arranque). Todo lo que lee panes ya tiene guardia `!panes`.
let api = null
export function ensurePlay() {
  if (!api) api = bootPlay()
  return api
}

function bootPlay() {
  loadPrefs()
  loadLayout()
  panes = {}
  for (const l of Object.keys(BUFFERS)) {    const ed = createEditor({
      textarea: document.getElementById(`play-ed-${l}`),
      gutter: document.getElementById(`play-gutter-${l}`),
      stage: document.getElementById(`play-stage-${l}`),
      pre: document.getElementById(`play-hl-${l}`),
      getLang: () => l,
      emmet: l,
      showCurline: () => getSetting('curline') !== false,
      commit: (v) => {
        BUFFERS[l] = v
        saveBuffer(l)
        schedulePreview()
      },
    })
    ed.setWrap(prefs.wrap)
    ed.setRaw(BUFFERS[l])
    panes[l] = ed
  }
  applyLayout()
  wireLayout()
  wirePreviewDiv()
  initConsole()
  // Salto desde errores de consola: línea del srcdoc → línea del pane JS.
  window.addEventListener('sukoshi:playgoto', (e) => {
    const srcLine = e.detail?.line
    if (!srcLine || !panes?.js) return
    const { pre } = srcdocParts()
    const line = Math.max(1, srcLine - pre.split('\n').length + 1)
    const ed = panes.js
    const v = ed.getValue()
    let off = 0
    for (let l = 1; l < line; l++) {
      const i = v.indexOf('\n', off)
      if (i < 0) { off = v.length; break }
      off = i + 1
    }
    ed.el.focus()
    ed.el.setSelectionRange(off, off)
    const lh = parseFloat(getComputedStyle(ed.el).lineHeight) || 22
    const sc = ed.el.offsetParent ?? ed.el
    sc.scrollTop = Math.max(0, (line - 1) * lh - sc.clientHeight / 2)
  })
  applySolo()
  applyZoom()
  document.getElementById('pb-layout')?.addEventListener('click', (e) => {
    e.stopPropagation()
    toggleLayoutPop()
  })
  document.addEventListener('click', (e) => {
    const pop = document.getElementById('pb-layout-pop')
    if (pop && !pop.hidden && !e.target.closest?.('#pb-layout-pop,#pb-layout')) {
      pop.hidden = true
    }
  })
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const pop = document.getElementById('pb-layout-pop')
      if (pop && !pop.hidden) pop.hidden = true
    }
  })
  return { toggle, isOpen, refresh: renderPreview }

  // Selector en cruz: izq/der a los costados, arriba/abajo al medio,
  // reset al centro. Marca el modo actual.
  function toggleLayoutPop() {
    const pop = document.getElementById('pb-layout-pop')
    if (!pop.hidden) {
      pop.hidden = true
      return
    }
    pop.innerHTML = ''
    // Orden visual: arriba, izquierda, abajo, derecha, centro.
    const order = [
      { mode: 'top', icon: 'chevron-up', area: '1 / 2', title: t('play.layTop') },
      { mode: 'left', icon: 'chevron-left', area: '2 / 1', title: t('play.layLeft') },
      { mode: 'bottom', icon: 'chevron-down', area: '3 / 2', title: t('play.layBottom') },
      { mode: 'right', icon: 'chevron-right', area: '2 / 3', title: t('play.layRight') },
      { mode: 'reset', icon: 'rotate-ccw', area: '2 / 2', title: t('play.layReset') },
    ]
    for (const c of order) {
      const b = document.createElement('button')
      b.style.gridArea = c.area
      b.title = c.title
      b.innerHTML = iconSVG(c.icon, 15)
      if (c.mode === layout.mode) b.classList.add('cur')
      b.addEventListener('click', () => {
        pop.hidden = true
        if (c.mode === 'reset') {
          layout.mode = 'left'
          layout.slots = {}
        } else {
          saveLayout()
          layout.mode = c.mode
        }
        applyLayout()
        saveLayout()
      })
      pop.appendChild(b)
    }
    const anchor = document.getElementById('pb-layout')
    if (anchor) pop.style.left = `${anchor.offsetLeft}px`
    pop.hidden = false
  }

  function applySolo() {
    document.body.classList.toggle('solo', prefs.solo)
  }

  function toggle() {
    const root = document.getElementById('play')
    const wrap = document.getElementById('editor-wrap')
    const willOpen = root.hidden
    root.hidden = !willOpen
    wrap.hidden = willOpen
    document.body.classList.toggle('play', willOpen)
    if (!willOpen) document.body.classList.remove('solo')
    else applySolo()
    if (willOpen) {
      for (const l of Object.keys(panes)) panes[l].refresh()
      renderPreview()
      panes.html.el.focus()
    }
  }

  function isOpen() {
    return !document.getElementById('play').hidden
  }
}

let currentPane = 0

// Sigue el foco para que el ciclo arranque desde el pane actual.
document.getElementById('play-editors')?.addEventListener('focusin', (e) => {
  if (!panes) return
  const i = ORDER.findIndex((l) => panes[l]?.el === e.target)
  if (i >= 0) currentPane = i
})

// Editor del pane con foco (null si el playground está cerrado).
export function playPaneEditor() {
  if (!panes || document.getElementById('play')?.hidden) return null
  return panes[ORDER[currentPane]] ?? null
}

export function playPaneLang() {
  return ORDER[currentPane]
}

export function focusPane(i) {
  if (!panes) return
  currentPane = ((i % 3) + 3) % 3
  panes[ORDER[currentPane]]?.el.focus()
}

export function cyclePanes() {
  if (!panes) return
  const active = document.activeElement
  const i = ORDER.findIndex((l) => panes[l]?.el === active)
  focusPane(i < 0 ? currentPane + 1 : i + 1)
}
