import { activeDoc, setFilePath, setDirty } from './state.js'
import { openFile, saveFile, saveFileAs } from './files.js'
import { initPalette } from './palette.js'
import { setupTabs, newTab, closeTab, cycleTab, switchTab, tabList, pristineTab, openGrid, isGridOpen } from './tabs.js'

export function initShortcuts(editor, settings = null) {
  setupTabs(editor)
  const actions = {
    new: () => newTab(),
    open: doOpen,
    save: doSave,
    saveAs: doSaveAs,
    close: doCloseTab,
    settings: () => settings?.open(),
    listTabs: tabList,
    gotoTab: (id) => switchTab(id),
    openGrid: () => openGrid(),
  }
  const palette = initPalette(editor, actions)
  const textarea = editor.el

  document.addEventListener('keydown', async (e) => {
    // Con el grid abierto el teclado lo maneja tabs.js.
    if (isGridOpen()) return
    const mod = e.ctrlKey || e.metaKey
    if (!mod) {
      if (e.key === 'Escape' && palette.visible()) palette.close()
      return
    }

    const key = e.key.toLowerCase()
    const shift = e.shiftKey

    if (key === 'n') { e.preventDefault(); newTab() }
    else if (key === 't') { e.preventDefault(); newTab() }
    else if (key === 'o') { e.preventDefault(); await doOpen() }
    else if (key === 's' && !shift) { e.preventDefault(); await doSave() }
    else if (key === 's' && shift) { e.preventDefault(); await doSaveAs() }
    else if (key === 'w') { e.preventDefault(); doCloseTab() }
    else if (key === 'tab') {
      e.preventDefault()
      if (shift) {
        if (!isGridOpen()) openGrid(true)
      }
      else cycleTab(1)
    }
    else if (key === 'k' || (key === 'p' && shift)) { e.preventDefault(); palette.open('commands') }
    else if (key === 'f') { e.preventDefault(); palette.open('find', selectedWord()) }
    else if (key === 'h') { e.preventDefault(); palette.open('replace', selectedWord()) }
    else if (key === 'g') { e.preventDefault(); palette.open('goto') }
    else if (key === 'b') { e.preventDefault(); editor.toggleWrap('**') }
    else if (key === 'i') { e.preventDefault(); editor.toggleWrap('*') }
    else if (key === 'x' && shift) { e.preventDefault(); editor.toggleWrap('~~') }
    else if (key === ',') { e.preventDefault(); settings?.toggle() }
  })

  function selectedWord() {
    const sel = textarea.value.slice(textarea.selectionStart, textarea.selectionEnd)
    return sel && !sel.includes('\n') ? sel : ''
  }

  async function doOpen() {
    const reuse = pristineTab()
    const r = await openFile(editor)
    if (!r) return
    const content = editor.getValue()
    if (!reuse) newTab()
    editor.setValue(content)
    const d = activeDoc()
    d.content = content
    if (r.filePath) setFilePath(r.filePath)
    else {
      setFilePath('')
      d.fileName = r.fileName
    }
    setDirty(false)
    editor.focus()
  }

  async function doSave() {
    const d = activeDoc()
    const r = await saveFile(editor, d.filePath, d.fileName)
    if (!r) return
    setFilePath(r.filePath || '')
    if (!r.filePath) activeDoc().fileName = r.fileName
    setDirty(false)
  }

  async function doSaveAs() {
    const r = await saveFileAs(editor, activeDoc().fileName)
    if (!r) return
    setFilePath(r.filePath || '')
    if (!r.filePath) activeDoc().fileName = r.fileName
    setDirty(false)
  }

  function doCloseTab() {
    const res = closeTab()
    if (res === 'quit') {
      if (window.runtime?.Quit) window.runtime.Quit()
      else if (activeDoc().dirty && !confirm('Hay cambios sin guardar. ¿Cerrar?')) return
      else window.close()
    }
  }

  return { newFile: () => newTab(), openFile: doOpen, saveFile: doSave, saveFileAs: doSaveAs }
}
