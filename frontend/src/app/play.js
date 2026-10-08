import { createEditor } from './editor.js'

// Playground web: 3 buffers (HTML/CSS/JS) + preview en vivo en iframe
// sandboxed (sin acceso a los bindings de Go). No toca docs ni pestañas.
const BUFFERS = { html: '', css: '', js: '' }
const KEY = (l) => `sukoshi-play-${l}`
let panes = null
let previewTimer = 0

function loadBuffers() {
  let seen = false
  for (const l of Object.keys(BUFFERS)) {
    try {
      const v = localStorage.getItem(KEY(l))
      if (v !== null) seen = true
      BUFFERS[l] = v ?? ''
    } catch {
      BUFFERS[l] = ''
    }
  }
  if (!seen) BUFFERS.html = '<h1>Hola</h1>\n<p>Escribe HTML, CSS y JS…</p>\n'
}

function saveBuffer(l) {
  try {
    localStorage.setItem(KEY(l), BUFFERS[l])
  } catch { /* sin storage */ }
}

function schedulePreview() {
  clearTimeout(previewTimer)
  previewTimer = setTimeout(renderPreview, 200)
}

function renderPreview() {
  const frame = document.getElementById('play-preview')
  if (!frame || document.getElementById('play').hidden) return
  const js = BUFFERS.js.replace(/<\/script/gi, '<\\/script')
  frame.srcdoc = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{background:#141414;color:#e5e5e5}a{color:#d29922}${BUFFERS.css}</style></head><body>${BUFFERS.html}<script>${js}<\/script></body></html>`
}

const LAYOUT_KEY = 'sukoshi-play-layout'
const ORDER = ['html', 'css', 'js']

function loadLayout() {
  try {
    return JSON.parse(localStorage.getItem(LAYOUT_KEY)) ?? null
  } catch {
    return null
  }
}

function saveLayout() {
  try {
    const els = [...document.querySelectorAll('.play-pane')]
    localStorage.setItem(LAYOUT_KEY, JSON.stringify({
      h: els.map((p) => Math.round(p.getBoundingClientRect().height)),
      c: els.map((p) => p.classList.contains('collapsed')),
    }))
  } catch { /* sin storage */ }
}

function applyLayout() {
  const L = loadLayout()
  if (!L) return
  const els = [...document.querySelectorAll('.play-pane')]
  els.forEach((p, i) => {
    if (L.c?.[i]) p.classList.add('collapsed')
    else if (L.h?.[i] > 0) {
      p.style.flex = `0 0 ${L.h[i]}px`
      p.dataset.h = p.style.flex
    }
  })
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
  document.querySelectorAll('.play-div').forEach((div) => {
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
      const y0 = e.clientY
      const ha = a.getBoundingClientRect().height
      const hb = b.getBoundingClientRect().height
      const total = ha + hb
      const MIN = 60
      // Suma constante: lo que crece uno lo pierde el otro; el tercero ni se mueve.
      if (total <= MIN * 2) return
      const move = (ev) => {
        const na = Math.min(Math.max(MIN, ha + (ev.clientY - y0)), total - MIN)
        a.style.flex = `0 0 ${na}px`
        b.style.flex = `0 0 ${total - na}px`
      }
      const up = () => {
        document.removeEventListener('mousemove', move)
        document.removeEventListener('mouseup', up)
        saveLayout()
      }
      document.addEventListener('mousemove', move)
      document.addEventListener('mouseup', up)
    })
  })
  // Si la ventana encoge y los altos fijos desbordan, se vuelve al reparto.
  // Si crece, se escala proporcional para no dejar hueco muerto.
  let lastH = 0
  window.addEventListener('resize', () => {
    const box = document.getElementById('play-editors')
    if (!box || document.getElementById('play').hidden || !box.clientHeight) return
    const h = box.clientHeight
    const panes = [...document.querySelectorAll('.play-pane')].filter((p) => !p.classList.contains('collapsed'))
    const sum = panes.reduce((t, p) => t + p.getBoundingClientRect().height, 0)
    if (sum > h + 1) {
      panes.forEach((p) => { p.style.flex = '' })
      saveLayout()
    } else if (lastH && h !== lastH) {
      const ratio = h / lastH
      panes.forEach((p) => {
        const m = p.style.flex.match(/0 0 ([\d.]+)px/)
        if (m) p.style.flex = `0 0 ${Math.max(60, +m[1] * ratio)}px`
      })
    }
    lastH = h
  })
}

export function initPlay() {
  loadBuffers()
  panes = {}
  for (const l of Object.keys(BUFFERS)) {
    const ed = createEditor({
      textarea: document.getElementById(`play-ed-${l}`),
      gutter: document.getElementById(`play-gutter-${l}`),
      stage: document.getElementById(`play-stage-${l}`),
      pre: document.getElementById(`play-hl-${l}`),
      getLang: () => l,
      commit: (v) => {
        BUFFERS[l] = v
        saveBuffer(l)
        schedulePreview()
      },
    })
    ed.setRaw(BUFFERS[l])
    panes[l] = ed
  }
  applyLayout()
  wireLayout()
  return { toggle, isOpen }

  function toggle() {
    const root = document.getElementById('play')
    const wrap = document.getElementById('editor-wrap')
    const willOpen = root.hidden
    root.hidden = !willOpen
    wrap.hidden = willOpen
    document.body.classList.toggle('play', willOpen)
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
