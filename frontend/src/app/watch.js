import { state, activeDoc, setDirty } from './state.js'
import { openPath } from './files.js'
import { toastDoc } from './tabs.js'
import { confirmModal } from './modal.js'
import { getSetting } from './settings.js'

// Mtimes conocidos por ruta. Se siembra en el primer vistazo y tras cada guardado.
const known = new Map()

export function noteSaved(path) {
  if (!path || !window.go?.main?.App) return
  window.go.main.App.Stat(path).then((m) => {
    if (m >= 0) known.set(path, m)
  }).catch(() => { /* disco inaccesible */ })
}

export function initWatch(editor) {
  setInterval(tick, 2500)
  setInterval(autosave, 10000)
  return {}

  async function tick() {
    if (!window.go?.main?.App) return
    for (const d of state.docs) {
      if (!d.filePath) continue
      let m = -2
      try {
        m = await window.go.main.App.Stat(d.filePath)
      } catch { /* reintentar próximo ciclo */ }
      if (m < 0) continue
      if (!known.has(d.filePath)) {
        known.set(d.filePath, m)
        continue
      }
      if (known.get(d.filePath) === m) continue
      known.set(d.filePath, m)
      await reloadDoc(d)
    }
  }

  // Autoguardado (off por defecto): cada 10s guarda pestañas con ruta y cambios.
  async function autosave() {
    if (!getSetting('autosave') || !window.go?.main?.App) return
    for (const d of state.docs) {
      if (!d.filePath || !d.dirty) continue
      const content = d === activeDoc() ? editor.getValue() : d.content
      try {
        await window.go.main.App.WriteFile(d.filePath, content)
        d.content = content
        if (d === activeDoc()) setDirty(false)
        else d.dirty = false
        noteSaved(d.filePath)
      } catch { /* reintentar próximo ciclo */ }
    }
  }

  async function reloadDoc(d) {
    const r = await openPath(d.filePath)
    if (!r) return
    if (d === activeDoc()) {
      if (!d.dirty) {
        d.content = r.content
        editor.setValue(r.content)
        setDirty(false)
        toastDoc()
      } else if ((await confirmModal({
        title: d.fileName,
        message: 'Cambió en disco. ¿Recargar y perder tus cambios?',
        buttons: [
          { label: 'Cancelar', value: 'cancel' },
          { label: 'Recargar', value: 'reload', primary: true },
        ],
      })) === 'reload') {
        d.content = r.content
        editor.setValue(r.content)
        setDirty(false)
      }
    } else if (!d.dirty) {
      d.content = r.content
    }
  }
}
