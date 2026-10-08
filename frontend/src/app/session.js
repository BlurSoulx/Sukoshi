import { state, activeDoc, onTabsChange, replaceDocs } from './state.js'
import { openPath } from './files.js'
import { showDoc, toastDoc } from './tabs.js'

const KEY = 'sukoshi-session-v1'
const MAX_BYTES = 2_000_000
const MAX_DOCS = 20

export function initSession(editor) {
  let t = 0
  const schedule = () => {
    clearTimeout(t)
    t = setTimeout(save, 1500)
  }
  editor.onActivity(schedule)
  onTabsChange(schedule)
  return { restore: () => restore(editor), save }
}

function snapshot() {
  const docs = []
  let size = 0
  for (const d of state.docs) {
    // El contenido solo se guarda si hace falta (nuevo o con cambios);
    // lo limpio se recarga del disco.
    const content = !d.filePath || d.dirty ? d.content : ''
    size += content.length
    if (size > MAX_BYTES) break
    docs.push({ filePath: d.filePath, fileName: d.fileName, dirty: d.dirty, sel: d.sel || 0, content })
  }
  const idx = state.docs.findIndex((d) => d.id === state.activeId)
  return { docs, active: Math.max(0, idx) }
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(snapshot()))
  } catch { /* storage lleno o ausente: se pierde la sesión, nada más */ }
}

async function restore(editor) {
  let snap = null
  try {
    snap = JSON.parse(localStorage.getItem(KEY))
  } catch { /* sin sesión previa */ }
  if (!snap?.docs?.length) return false
  const docs = []
  for (const s of snap.docs.slice(0, MAX_DOCS)) {
    let content = s.content || ''
    if (s.filePath && !content) {
      const r = await openPath(s.filePath)
      if (!r) continue
      content = r.content
    }
    docs.push({ filePath: s.filePath || '', fileName: s.fileName || 'untitled.md', content, dirty: !!s.dirty, sel: s.sel || 0 })
  }
  if (!docs.length) return false
  replaceDocs(docs, snap.active || 0)
  showDoc(activeDoc())
  toastDoc()
  return true
}
