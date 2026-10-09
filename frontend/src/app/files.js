import { activeDoc, setFilePath, setDirty } from './state.js'
import { newTab, pristineTab } from './tabs.js'

const hasWails = () => typeof window.go?.main?.App !== 'undefined'

function downloadFallback(filename, text) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

export async function openFile(editor) {
  if (hasWails()) {
    const res = await window.go.main.App.OpenAndRead()
    if (!res) return null
    editor.setValue(res.content ?? '')
    return { filePath: res.path, fileName: res.name }
  }
  // Fallback navegador (pnpm dev sin Wails): input file nativo.
  const picked = await new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.txt,.md,.markdown,.html,.css,.js,text/plain,text/markdown,text/html,text/css,text/javascript'
    input.onchange = () => resolve(input.files?.[0] ?? null)
    input.oncancel = () => resolve(null)
    input.click()
  })
  if (!picked) return null
  const content = await picked.text()
  editor.setValue(content)
  return { filePath: '', fileName: picked.name }
}

export async function saveFile(editor, currentPath, fileName) {
  trimForSave(editor)
  const content = editor.getValue()
  if (currentPath && hasWails()) {
    await window.go.main.App.WriteFile(currentPath, content)
    return { filePath: currentPath, fileName }
  }
  return saveFileAs(editor, fileName)
}

export async function saveFileAs(editor, fileName) {
  trimForSave(editor)
  const content = editor.getValue()
  if (hasWails()) {
    const path = await window.go.main.App.SaveAs(content, fileName || 'untitled.txt')
    if (!path) return null
    const parts = path.split(/[/\\]/)
    return { filePath: path, fileName: parts[parts.length - 1] }
  }
  downloadFallback(fileName || activeDoc().fileName || 'untitled.txt', content)
  return { filePath: '', fileName: fileName || activeDoc().fileName }
}

// Guarda contenido generado (exports): diálogo nativo o descarga.
export async function saveExportFile(fileName, content) {
  if (hasWails()) {
    try {
      return await window.go.main.App.SaveAs(content, fileName)
    } catch {
      return null
    }
  }
  downloadFallback(fileName, content)
  return ''
}

const RECENT_KEY = 'sukoshi-recent'
const RECENT_MAX = 10

export function getRecents() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY)) ?? []
  } catch {
    return []
  }
}

export function pushRecent(path) {
  if (!path) return
  try {
    const name = path.split(/[/\\]/).pop()
    const rest = getRecents().filter((x) => x.path !== path)
    rest.unshift({ path, name })
    localStorage.setItem(RECENT_KEY, JSON.stringify(rest.slice(0, RECENT_MAX)))
  } catch { /* sin storage */ }
}

function dropRecent(path) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(getRecents().filter((x) => x.path !== path)))
  } catch { /* sin storage */ }
}

// Carga pura por ruta (sin tocar el editor): null si falla o no hay Wails.
export async function openPath(path) {
  if (!hasWails()) return null
  try {
    const content = await window.go.main.App.ReadFile(path)
    return { content, filePath: path, fileName: path.split(/[/\\]/).pop() }
  } catch {
    dropRecent(path)
    return null
  }
}

// Limpieza al guardar: sin espacios al final de línea y con salto final.
// Conserva cursor y scroll; dispara input para gutter/footer/stats.
function trimForSave(editor) {
  const ta = editor.el
  const v = ta.value
  if (!v) return
  const cleaned = v.replace(/[ \t]+$/gm, '')
  const final = cleaned.endsWith('\n') ? cleaned : cleaned + '\n'
  if (final === v) return
  const { selectionStart, selectionEnd, scrollTop } = ta
  ta.value = final
  ta.setSelectionRange(Math.min(selectionStart, final.length), Math.min(selectionEnd, final.length))
  ta.scrollTop = scrollTop
  ta.dispatchEvent(new Event('input', { bubbles: true }))
}

// Lleva un archivo ya cargado a la pestaña actual (virgen) o a una nueva.
export function adoptFile(editor, { content, filePath, fileName }) {
  if (!pristineTab()) newTab()
  editor.setValue(content)
  const d = activeDoc()
  d.content = content
  if (filePath) setFilePath(filePath)
  else {
    setFilePath('')
    d.fileName = fileName
  }
  setDirty(false)
  editor.focus()
}
