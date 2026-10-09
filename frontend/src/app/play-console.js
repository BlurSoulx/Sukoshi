// Consola del playground: muestra console.log/info/warn/error y errores
// del iframe (vía postMessage del shim). Sin dependencias.
import { t } from './i18n.js'
const MAX_LINES = 200
let evalId = 0

export function initConsole() {
  document.getElementById('pb-console')?.addEventListener('click', () => toggle())
  document.getElementById('play-console-clear')?.addEventListener('click', clear)
  document.getElementById('play-console-entry')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      evaluate(e.target.value)
      e.target.value = ''
    }
  })
  window.addEventListener('message', (e) => {
    const frame = document.getElementById('play-preview')
    if (!frame || e.source !== frame.contentWindow) return
    const d = e.data
    if (!d) return
    if (d.__sukoshi_console) append(d.type, d.args)
    else if (d.__sukoshi_result) {
      append(d.ok ? 'result' : 'error', [d.ok ? stringify(d.value) : d.value])
    }
  })
  return { toggle, clear, isOpen }

  function isOpen() {
    return !document.getElementById('play-console').hidden
  }

  function toggle(force) {
    const root = document.getElementById('play-console')
    const show = force !== undefined ? force : root.hidden
    root.hidden = !show
    const btn = document.getElementById('pb-console')
    btn?.classList.toggle('on', show)
    if (show) btn?.classList.remove('has-new')
  }

  function clear() {
    document.getElementById('play-console-log').innerHTML = ''
  }

  // REPL: evalúa en el contexto del iframe (ve sus variables) y muestra el retorno.
  function evaluate(code) {
    const frame = document.getElementById('play-preview')
    if (!frame || !code.trim()) return
    echo('› ' + code)
    frame.contentWindow.postMessage({ __sukoshi_eval: 1, id: ++evalId, code }, '*')
  }

  function echo(text) {
    const log = document.getElementById('play-console-log')
    if (!log) return
    const line = document.createElement('div')
    line.className = 'cl-in'
    line.textContent = text
    log.appendChild(line)
    while (log.children.length > MAX_LINES) log.firstChild.remove()
    log.scrollTop = log.scrollHeight
  }

  function stringify(v) {
    try {
      const s = typeof v === 'string' ? v : JSON.stringify(v)
      return s === undefined ? 'undefined' : String(s).slice(0, 500)
    } catch {
      return String(v).slice(0, 500)
    }
  }

  function append(type, args) {
    const log = document.getElementById('play-console-log')
    if (!log) return
    const text = (args ?? []).map((a) => String(a)).join(' ')
    // El código a medio escribir falla en cada tecla: no se repite el mismo error seguido.
    const prev = log.lastChild
    if (prev && prev.dataset.t === type && prev.dataset.x === text) return
    const line = document.createElement('div')
    if (type === 'error') {
      line.className = 'cl-err'
      // Línea clicable: salta a esa línea del pane JS (vía evento, sin ciclos).
      const m = /:(\d+):(\d+)\)?\s*$/.exec(text.split('\n')[0])
      if (m) {
        line.classList.add('cl-jump')
        line.title = t('play.gotoLine')
        line.addEventListener('click', () => {
          window.dispatchEvent(new CustomEvent('sukoshi:playgoto', { detail: { line: +m[1] } }))
        })
      }
    }
    else if (type === 'warn') line.className = 'cl-warn'
    line.dataset.t = type
    line.dataset.x = text
    line.textContent = text
    log.appendChild(line)
    while (log.children.length > MAX_LINES) log.firstChild.remove()
    log.scrollTop = log.scrollHeight
    if (document.getElementById('play-console').hidden) {
      document.getElementById('pb-console')?.classList.add('has-new')
    }
  }
}
