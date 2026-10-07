import { createEditor } from './editor.js'
import { initShortcuts } from './shortcuts.js'
import { initFooter } from './footer.js'
import { initSettings } from './settings.js'
import { setDirty } from './state.js'

export function initApp() {
  const textarea = document.getElementById('editor')
  const gutter = document.getElementById('gutter')
  if (!textarea || !gutter) throw new Error('Falta #editor o #gutter')

  const editor = createEditor(textarea, gutter)
  editor.setValue('')
  setDirty(false)

  initFooter(editor)
  const settings = initSettings()
  const files = initShortcuts(editor, settings)

  document.getElementById('tb-new')?.addEventListener('click', () => files.newFile())
  document.getElementById('tb-open')?.addEventListener('click', () => files.openFile())
  document.getElementById('tb-save')?.addEventListener('click', () => files.saveFile())

  document.getElementById('tb-settings')?.addEventListener('click', () => {
    settings.toggle()
  })

  // Barra de título propia: arrastra la ventana, doble-click maximiza.
  const bar = document.getElementById('titlebar')
  bar?.addEventListener('dblclick', (e) => {
    if (e.target.closest('button')) return
    window.runtime?.WindowToggleMaximise?.()
    syncResizeFlag()
  })
  document.getElementById('tb-min')?.addEventListener('click', () => {
    window.runtime?.WindowMinimise?.()
  })
  document.getElementById('tb-max')?.addEventListener('click', () => {
    window.runtime?.WindowToggleMaximise?.()
    syncResizeFlag()
  })
  document.getElementById('tb-close')?.addEventListener('click', () => {
    if (window.runtime?.Quit) window.runtime.Quit()
    else window.close()
  })

  // Wails dibuja cursores de resize en los bordes aunque esté maximizada.
  // Se corrige apagando su flag interno cuando la ventana está maximizada.
  // Se re-evalúa en cada resize (Win+flechas, snap) y al soltar el mouse
  // (arrastrar arriba para maximizar, o arrastrar para restaurar).
  let resizeTimer = 0
  const scheduleSync = (delay) => {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(syncResizeFlag, delay)
  }
  window.addEventListener('resize', () => scheduleSync(150))
  window.addEventListener('mouseup', () => {
    syncResizeFlag()
    scheduleSync(300)
  })
  syncResizeFlag()

  async function syncResizeFlag() {
    const flags = window.wails?.flags
    if (!flags) return
    try {
      const max = await window.runtime?.WindowIsMaximised?.()
      flags.enableResize = max !== true
    } catch {
      /* sin runtime (navegador): no hay nada que corregir */
    }
  }

  // Ctrl+rueda: zoom solo del editor (respeta DPI/zoom del SO).
  textarea.addEventListener('wheel', (e) => {
    if (!e.ctrlKey) return
    e.preventDefault()
    const size = parseFloat(getComputedStyle(textarea).fontSize) || 14
    textarea.style.fontSize = `${Math.min(32, Math.max(10, size + (e.deltaY < 0 ? 1 : -1)))}px`
  }, { passive: false })

  editor.focus()
}
