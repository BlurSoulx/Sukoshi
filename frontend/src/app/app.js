import { createEditor } from './editor.js'
import { initShortcuts } from './shortcuts.js'
import { initFooter } from './footer.js'
import { initSettings, getSetting } from './settings.js'
import { applyI18n } from './i18n.js'
import { initSession } from './session.js'
import { initWatch } from './watch.js'
import { adoptFile } from './files.js'
import { loadInto } from './play.js'
import { setDirty } from './state.js'

export function initApp() {
  applyI18n()
  const textarea = document.getElementById('editor')
  const gutter = document.getElementById('gutter')
  if (!textarea || !gutter) throw new Error('Falta #editor o #gutter')

  const editor = createEditor({
    textarea,
    gutter,
    stage: document.getElementById('stage'),
    pre: document.getElementById('hl'),
    detect: true,
    showCurline: () => getSetting('curline') !== false,
  })
  initFooter(editor)
  const settings = initSettings()
  const files = initShortcuts(editor, settings)
  const session = initSession(editor)
  initWatch(editor)

  // Arrastrar archivos a la ventana los abre (máx. 8, solo texto/markdown).
  window.runtime?.OnFileDrop?.((x, y, paths) => {
    files.openPaths(paths)
  }, false)
  window.addEventListener('dragover', (e) => e.preventDefault())
  window.addEventListener('drop', async (e) => {
    e.preventDefault()
    if (window.go?.main?.App) return
    const files = [...(e.dataTransfer?.files ?? [])].filter((x) => /\.(txt|md|markdown|html|css|js)$/i.test(x.name)).slice(0, 8)
    if (document.body.classList.contains('play')) {
      for (const f of files) {
        const m = /\.([^.]+)$/.exec(f.name)
        const lang = { html: 'html', css: 'css', js: 'js' }[m?.[1]?.toLowerCase()]
        if (lang) loadInto(lang, await f.text())
      }
      return
    }
    for (const f of files) {
      adoptFile(editor, { content: await f.text(), filePath: '', fileName: f.name })
    }
  })

  document.getElementById('tb-new')?.addEventListener('click', () => { if (!inPlay()) files.newFile() })
  document.getElementById('tb-open')?.addEventListener('click', () => { if (!inPlay()) files.openFile() })
  document.getElementById('tb-save')?.addEventListener('click', () => { if (!inPlay()) files.saveFile() })

  document.getElementById('tb-settings')?.addEventListener('click', () => {
    settings.toggle()
  })

  // Barra de título propia: arrastra la ventana, doble-click maximiza.
  // En modo playground los botones de archivo no actúan (son del editor).
  const inPlay = () => document.body.classList.contains('play')
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

  // Ctrl+rueda: zoom del editor persistido en config (gutter incluido vía variable).
  textarea.addEventListener('wheel', (e) => {
    if (!e.ctrlKey) return
    e.preventDefault()
    settings.changeFontSize(e.deltaY < 0 ? 1 : -1)
    editor.refresh()
  }, { passive: false })
  window.addEventListener('resize', () => editor.refresh())

  // Sesión anterior (si existe) o documento en blanco. Bloqueado hasta
  // resolver para no pisar lo que el usuario escriba en esos ms.
  // El catch garantiza que un restore roto jamás deje el editor bloqueado.
  textarea.disabled = true
  session.restore().then((ok) => {
    if (!ok) {
      editor.setValue('')
      setDirty(false)
    }
  }).catch(() => {
    editor.setValue('')
    setDirty(false)
  }).then(async () => {
    // "Abrir con" (args del .exe): se abren tras la sesión, en pestañas.
    // Sin filtro de extensión: si el usuario lo abre con Sukoshi, lo abrimos.
    try {
      const pending = await window.go?.main?.App?.ConsumePendingFiles()
      if (pending?.length) await files.openPaths(pending, true)
    } catch { /* sin backend o rutas inválidas: arranque normal */ }
    textarea.disabled = false
    editor.focus()
  })
}
