import { activeDoc, setFilePath, setDirty } from './state.js'
import { openFile, saveFile, saveFileAs, openPath, adoptFile, pushRecent, getRecents } from './files.js'
import { isModalOpen, showInfo } from './modal.js'
import { SYNTAX_HTML } from './syntax.js'
import { noteSaved } from './watch.js'
import { initPalette } from './palette.js'
import { initPreview } from './preview.js'
import { initPlay } from './play.js'
import { setupTabs, newTab, closeTab, cycleTab, switchTab, tabList, pristineTab, openGrid, isGridOpen, reopenTab } from './tabs.js'

export function initShortcuts(editor, settings = null) {
  setupTabs(editor)
  const preview = initPreview(editor)
  const play = initPlay()
  const actions = {
    new: () => newTab(),
    open: doOpen,
    save: doSave,
    saveAs: doSaveAs,
    close: doCloseTab,
    settings: () => settings?.open(),
    toggleZen: () => settings?.toggleZen(),
    listTabs: tabList,
    gotoTab: (id) => switchTab(id),
    openGrid: () => openGrid(),
    reopenTab: () => reopenTab(),
    toggleWrap: () => editor.toggleWrapLines(),
    togglePreview: () => preview.toggle(),
    togglePlay: () => play.toggle(),
    toUpper: () => editor.changeCase('upper'),
    toLower: () => editor.changeCase('lower'),
    joinLines: () => editor.joinLines(),
    sortLines: () => editor.sortLines(),
    formatTable: () => editor.formatTable(),
    copyPath: () => copyPath(),
    showSyntax: () => showInfo({ title: 'Sintaxis Markdown', body: SYNTAX_HTML, wide: true }),
    listRecents: getRecents,
    openRecent: (path) => doOpenPath(path),
  }
  const palette = initPalette(editor, actions)
  const textarea = editor.el

  document.addEventListener('keydown', async (e) => {
    // Con el grid o el modal abiertos, el teclado lo manejan ellos.
    if (isGridOpen() || isModalOpen()) return
    const mod = e.ctrlKey || e.metaKey
    if (!mod) {
      if (e.key === 'Escape' && palette.visible()) palette.close()
      else if (e.key === 'F11') { e.preventDefault(); settings?.toggleZen() }
      else if (e.altKey && e.key.toLowerCase() === 'z') { e.preventDefault(); editor.toggleWrapLines() }
      else if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        e.preventDefault()
        editor.moveLines(e.key === 'ArrowUp' ? -1 : 1)
      }
      return
    }

    const key = e.key.toLowerCase()
    const shift = e.shiftKey

    if (key === 'n') { e.preventDefault(); newTab() }
    else if (key === 't' && !shift) { e.preventDefault(); newTab() }
    else if (key === 't' && shift) { e.preventDefault(); reopenTab() }
    else if (key === 'o') { e.preventDefault(); await doOpen() }
    else if (key === 's' && !shift) { e.preventDefault(); await doSave() }
    else if (key === 's' && shift) { e.preventDefault(); await doSaveAs() }
    else if (key === 'w') { e.preventDefault(); doCloseTab() }
    else if (key === 'tab') {
      e.preventDefault()
      if (shift) {
        if (!isGridOpen()) openGrid(true)
      }
      else cycleTab()
    }
    else if (key === 'k' || (key === 'p' && shift)) { e.preventDefault(); palette.open('commands') }
    else if (key === 'f') { e.preventDefault(); palette.open('find', selectedWord()) }
    else if (key === 'h') { e.preventDefault(); palette.open('replace', selectedWord()) }
    else if (key === 'g') { e.preventDefault(); palette.open('goto') }
    else if (key === 'b') { e.preventDefault(); editor.toggleWrap('**') }
    else if (key === 'i') { e.preventDefault(); editor.toggleWrap('*') }
    else if (key === 'x' && shift) { e.preventDefault(); editor.toggleWrap('~~') }
    else if (key === 'd' && !shift) { e.preventDefault(); editor.duplicateLines() }
    else if (key === 'j' && !shift) { e.preventDefault(); editor.joinLines() }
    else if (key === 'v' && shift) { e.preventDefault(); preview.toggle() }
    else if (key === ',') { e.preventDefault(); settings?.toggle() }
  })

  function selectedWord() {
    const sel = textarea.value.slice(textarea.selectionStart, textarea.selectionEnd)
    return sel && !sel.includes('\n') ? sel : ''
  }

  async function doOpen() {
    const r = await openFile(editor)
    if (!r) return
    adoptFile(editor, { content: editor.getValue(), filePath: r.filePath, fileName: r.fileName })
    pushRecent(r.filePath)
  }

  async function doOpenPath(path) {
    const r = await openPath(path)
    if (!r) return
    adoptFile(editor, r)
  }

  async function doOpenPaths(paths) {
    for (const p of paths.filter((x) => /\.(txt|md|markdown|html|css|js)$/i.test(x)).slice(0, 8)) {
      const r = await openPath(p)
      if (!r) continue
      adoptFile(editor, r)
      pushRecent(r.filePath)
    }
  }

  async function doSave() {
    const d = activeDoc()
    const r = await saveFile(editor, d.filePath, d.fileName)
    if (!r) return
    setFilePath(r.filePath || '')
    if (!r.filePath) activeDoc().fileName = r.fileName
    setDirty(false)
    pushRecent(r.filePath)
    noteSaved(r.filePath)
  }

  async function doSaveAs() {
    const r = await saveFileAs(editor, activeDoc().fileName)
    if (!r) return
    setFilePath(r.filePath || '')
    if (!r.filePath) activeDoc().fileName = r.fileName
    setDirty(false)
    pushRecent(r.filePath)
    noteSaved(r.filePath)
  }

  async function doCloseTab() {
    const res = await closeTab(async () => {
      await doSave()
      return !activeDoc().dirty
    })
    if (res === 'quit') {
      if (window.runtime?.Quit) window.runtime.Quit()
      else window.close()
    }
  }

  async function copyPath() {
    const d = activeDoc()
    const text = d.filePath || d.fileName
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      try { document.execCommand('copy') } catch { /* portapapeles bloqueado */ }
      ta.remove()
    }
  }

  return { newFile: () => newTab(), openFile: doOpen, saveFile: doSave, saveFileAs: doSaveAs, openPaths: doOpenPaths }
}
