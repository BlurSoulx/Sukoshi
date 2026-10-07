import { activeDoc } from './state.js'

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
    input.accept = '.txt,.md,.markdown,text/plain,text/markdown'
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
  const content = editor.getValue()
  if (currentPath && hasWails()) {
    await window.go.main.App.WriteFile(currentPath, content)
    return { filePath: currentPath, fileName }
  }
  return saveFileAs(editor, fileName)
}

export async function saveFileAs(editor, fileName) {
  const content = editor.getValue()
  if (hasWails()) {
    const path = await window.go.main.App.SaveAs(content, fileName || 'untitled.md')
    if (!path) return null
    const parts = path.split(/[/\\]/)
    return { filePath: path, fileName: parts[parts.length - 1] }
  }
  downloadFallback(fileName || activeDoc().fileName || 'untitled.md', content)
  return { filePath: '', fileName: fileName || activeDoc().fileName }
}
