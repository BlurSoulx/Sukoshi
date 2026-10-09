import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { currentTheme } from './settings.js'

// Vista previa solo bajo demanda: no parsea nada hasta abrirse.
export function initPreview(editor) {
  const wrap = document.getElementById('editor-wrap')
  const pane = document.createElement('div')
  pane.id = 'preview'
  pane.hidden = true
  wrap.appendChild(pane)

  // Tiempo real: render como mucho 1 vez por frame, sin debounce.
  // marked+sanitize tardan pocos ms en docs normales; en docs enormes
  // el coalescing por frame evita jank mientras se escribe.
  let queued = false
  let last = null
  const render = () => {
    const v = editor.getValue()
    if (v === last) return
    last = v
    pane.innerHTML = DOMPurify.sanitize(marked.parse(v, { breaks: true, gfm: true }))
  }
  const schedule = () => {
    if (queued || pane.hidden) return
    queued = true
    requestAnimationFrame(() => {
      queued = false
      render()
    })
  }
  editor.onActivity(schedule)

  function toggle() {
    pane.hidden = !pane.hidden
    wrap.classList.toggle('split', !pane.hidden)
    if (!pane.hidden) render()
    editor.focus()
  }

  // Documento .html autónomo con el contenido renderizado y los colores del tema.
  function exportHTML(title) {
    render()
    const t = currentTheme()
    const body = pane.innerHTML
    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>${String(title || 'documento').replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]))}</title>
<style>body{background:${t.ui.previewBg};color:${t.ui.previewFg};font-family:system-ui,sans-serif;line-height:1.6;max-width:820px;margin:2em auto;padding:0 1em}a{color:${t.ui.accent}}pre{background:${t.ui.searchBg};padding:1em;border-radius:6px;overflow:auto}code{font-family:ui-monospace,Consolas,monospace}table{border-collapse:collapse}th,td{border:1px solid ${t.ui.gutter};padding:.3em .7em}</style>
</head>
<body>${body}</body>
</html>`
  }

  return { toggle, isOpen: () => !pane.hidden, exportHTML }
}
