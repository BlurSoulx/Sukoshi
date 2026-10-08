import { marked } from 'marked'
import DOMPurify from 'dompurify'

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

  return { toggle, isOpen: () => !pane.hidden }
}
