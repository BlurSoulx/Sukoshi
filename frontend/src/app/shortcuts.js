import { state, activeDoc, setFilePath, setDirty, removeDoc } from './state.js'
import { openFile, saveFile, saveFileAs, saveExportFile, openPath, adoptFile, pushRecent, getRecents } from './files.js'
import { loadInto, templateNames, applyTemplate, buffersEmpty, buildSrcdoc, getBuffers } from './play.js'
import { isModalOpen, showInfo, confirmModal } from './modal.js'
import { SYNTAX_HTML, SHORTCUTS_HTML, SYNTAX_HTML_EN, SHORTCUTS_HTML_EN } from './syntax.js'
import { t, getLang } from './i18n.js'
import { noteSaved } from './watch.js'
import { initPalette } from './palette.js'
import { iconSVG } from './icons.js'
import { initPreview } from './preview.js'
import { ensurePlay, focusPane, cyclePanes, togglePlayWrap, playPrefs, togglePlayPause, cyclePlayViewport, togglePlaySolo, cyclePlayZoom, zoomPlayBy, resetPlayZoom, rerunPreview, playPaneEditor, playPaneLang } from './play.js'
import { setupTabs, newTab, closeTab, cycleTab, switchTab, tabList, pristineTab, openGrid, isGridOpen, reopenTab } from './tabs.js'

export function initShortcuts(editor, settings = null) {
  setupTabs(editor)
  const preview = initPreview(editor)
  // Playground perezoso: se crea al abrirlo (o al exportar/plantilla).
  let play = null
  const getPlay = () => (play ??= ensurePlay())
  const isPlayOpen = () => play?.isOpen() ?? false
  // Todo lo de edición opera sobre el pane enfocado si el playground está abierto.
  const focusedEd = () => playPaneEditor() ?? editor
  const actions = {
    new: () => newTab(),
    open: doOpen,
    save: doSave,
    saveAs: doSaveAs,
    saveAll: () => doSaveAll(),
    close: doCloseTab,
    closeOthers: () => doCloseOthers(),
    settings: () => settings?.open(),
    toggleZen: () => settings?.toggleZen(),
    listTabs: tabList,
    gotoTab: (id) => switchTab(id),
    openGrid: () => openGrid(),
    reopenTab: () => reopenTab(),
    toggleWrap: () => focusedEd().toggleWrapLines(),
    togglePreview: () => preview.toggle(),
    togglePlay: () => getPlay().toggle(),
    toUpper: () => focusedEd().changeCase('upper'),
    toLower: () => focusedEd().changeCase('lower'),
    undo: () => focusedEd().undo(),
    redo: () => focusedEd().redo(),
    joinLines: () => focusedEd().joinLines(),
    sortLines: () => focusedEd().sortLines(),
    toggleComment: () => focusedEd().toggleComment(),
    formatTable: () => focusedEd().formatTable(),
    copyPath: () => copyPath(),
    showSyntax: () => showInfo({ title: t('cheat.syntax'), body: getLang() === 'en' ? SYNTAX_HTML_EN : SYNTAX_HTML, wide: true }),
    showShortcuts: () => showInfo({ title: t('cheat.shortcuts'), body: getLang() === 'en' ? SHORTCUTS_HTML_EN : SHORTCUTS_HTML, wide: true }),
    exportMD: () => doExportMD(),
    listRecents: getRecents,
    openRecent: (path) => doOpenPath(path),
    searchAll: (q) => doSearchAll(q),
    gotoMatch: (it) => doGotoMatch(it),
    playTemplates: templateNames,
    playTemplate: (id) => doPlayTemplate(id),
    playExternal: () => doPlayExternal(),
    playExportZip: () => doPlayExportZip(),
    playExportSingle: () => doPlayExportSingle(),
  }
  const palette = initPalette(focusedEd, actions)

  document.getElementById('pb-more')?.addEventListener('click', (e) => {
    e.stopPropagation()
    togglePlayMenu()
  })

  function togglePlayMenu() {
    const menu = document.getElementById('pb-menu')
    if (!menu.hidden) {
      menu.hidden = true
      return
    }
    const p = playPrefs()
    const vw = ['100%', '768', '390'][[0, 1, 2].includes(p.viewport) ? p.viewport : 0]
    const zm = `${Math.round((p.zoom ?? 1) * 100)}%`
    const groups = [
      {
        label: t('menu.view'), rows: [
          { label: t('menu.viewport'), st: vw, icon: 'monitor', run: cyclePlayViewport },
          { label: t('menu.solo'), st: p.solo ? '✓' : '', icon: 'expand', run: togglePlaySolo },
          { label: t('menu.zoom'), st: zm, icon: 'search', run: cyclePlayZoom },
          { label: t('menu.wrap'), st: p.wrap ? '✓' : '', icon: 'align-left', run: togglePlayWrap },
        ],
      },
      {
        label: t('menu.live'), rows: [
          { label: t('menu.pause'), st: p.paused ? '✓' : '', icon: 'pause', run: togglePlayPause },
          { label: t('menu.rerun'), st: '', icon: 'refresh', run: rerunPreview },
        ],
      },
      {
        label: t('menu.out'), rows: [
          { label: t('menu.external'), st: '', icon: 'external', run: () => doPlayExternal() },
          { label: t('menu.single'), st: '', icon: 'download', run: () => doPlayExportSingle() },
          { label: t('menu.zip'), st: '', icon: 'archive', run: () => doPlayExportZip() },
        ],
      },
    ]
    menu.innerHTML = ''
    const btns = []
    groups.forEach((g, gi) => {
      if (gi > 0) {
        const sep = document.createElement('div')
        sep.className = 'msep'
        menu.appendChild(sep)
      }
      const head = document.createElement('div')
      head.className = 'mhead'
      head.textContent = g.label
      menu.appendChild(head)
      for (const r of g.rows) {
        const b = document.createElement('button')
        const ic = document.createElement('span')
        ic.className = 'mic'
        ic.innerHTML = iconSVG(r.icon)
        b.appendChild(ic)
        const name = document.createElement('span')
        name.textContent = r.label
        b.appendChild(name)
        if (r.st) {
          const st = document.createElement('span')
          st.className = 'st'
          st.textContent = r.st
          b.appendChild(st)
        }
        b.addEventListener('click', () => {
          menu.hidden = true
          r.run()
        })
        menu.appendChild(b)
      }
    })
    // Alineado al borde izquierdo del botón ···
    const anchor = document.getElementById('pb-more')
    if (anchor) menu.style.left = `${anchor.offsetLeft}px`
    menu.hidden = false
  }

  document.addEventListener('click', (e) => {
    const menu = document.getElementById('pb-menu')
    if (menu && !menu.hidden && !e.target.closest?.('#pb-menu,#pb-more')) {
      menu.hidden = true
    }
  })

  document.addEventListener('keydown', async (e) => {
    const pbMenu = document.getElementById('pb-menu')
    if (pbMenu && !pbMenu.hidden && e.key === 'Escape') {
      pbMenu.hidden = true
      return
    }
    // Con el grid o el modal abiertos, el teclado lo manejan ellos.
    if (isGridOpen() || isModalOpen()) return
    const mod = e.ctrlKey || e.metaKey
    // Deshacer/rehacer propio solo con foco en un editor (en inputs manda el nativo).
    const inEd = e.target.closest?.('.ed')
    if (mod && inEd && (e.key.toLowerCase() === 'z' || e.key.toLowerCase() === 'y')) {
      e.preventDefault()
      if (e.key.toLowerCase() === 'y' || e.shiftKey) focusedEd().redo()
      else focusedEd().undo()
      return
    }
    if (!mod) {
      if (e.key === 'Escape' && palette.visible()) palette.close()
      else if (e.key === 'F11') { e.preventDefault(); settings?.toggleZen() }
      else if (e.key === 'F1') { e.preventDefault(); showInfo({ title: t('cheat.shortcuts'), body: getLang() === 'en' ? SHORTCUTS_HTML_EN : SHORTCUTS_HTML, wide: true }) }
      else if (e.altKey && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (isPlayOpen()) togglePlayWrap()
        else editor.toggleWrapLines()
      }
      else if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        e.preventDefault()
        focusedEd().moveLines(e.key === 'ArrowUp' ? -1 : 1)
      }
      return
    }

    const key = e.key.toLowerCase()
    const shift = e.shiftKey

    if (key === 'n') { e.preventDefault(); newTab() }
    else if (key === 't' && !shift) { e.preventDefault(); newTab() }
    else if (key === 't' && shift) { e.preventDefault(); reopenTab() }
    // Tecla bajo Esc / izquierda del 1 (Backquote en cualquier idioma).
    else if (e.code === 'Backquote') { e.preventDefault(); getPlay().toggle() }
    else if (key === 'o') { e.preventDefault(); await doOpen() }
    else if (key === 's' && !shift) { e.preventDefault(); await doSave() }
    else if (key === 's' && shift) { e.preventDefault(); await doSaveAs() }
    else if (key === 'w') { e.preventDefault(); doCloseTab() }
    else if (key === 'tab') {
      e.preventDefault()
      if (shift) {
        if (!isGridOpen()) openGrid(true)
      }
      else if (isPlayOpen()) cyclePanes()
      else cycleTab()
    }
    else if ((key === '1' || key === '2' || key === '3') && !shift) {
      if (isPlayOpen()) {
        e.preventDefault()
        focusPane(+key - 1)
      }
    }
    else if (key === 'k' || (key === 'p' && shift)) { e.preventDefault(); palette.open('commands') }
    else if (key === 'f' && !shift) { e.preventDefault(); palette.open('find', selectedWord()) }
    else if (key === 'f' && shift) { e.preventDefault(); palette.open('all', selectedWord()) }
    else if (key === 'h') { e.preventDefault(); palette.open('replace', selectedWord()) }
    else if (key === 'g') { e.preventDefault(); palette.open('goto') }
    else if (key === 'b') { e.preventDefault(); focusedEd().toggleWrap('**') }
    else if (key === 'i') { e.preventDefault(); focusedEd().toggleWrap('*') }
    else if (key === 'x' && shift) { e.preventDefault(); focusedEd().toggleWrap('~~') }
    else if (key === 'd' && !shift) { e.preventDefault(); focusedEd().duplicateLines() }
    else if (key === 'j' && !shift) { e.preventDefault(); focusedEd().joinLines() }
    else if (key === '/' || key === '.') { e.preventDefault(); focusedEd().toggleComment() }
    else if (key === 'v' && shift) { e.preventDefault(); preview.toggle() }
    else if (key === ',' ) { e.preventDefault(); settings?.toggle() }
    // Zoom del preview (la rueda no llega al iframe): solo en playground.
    else if (isPlayOpen() && (key === '+' || key === '=')) { e.preventDefault(); zoomPlayBy(1) }
    else if (isPlayOpen() && key === '-') { e.preventDefault(); zoomPlayBy(-1) }
    else if (isPlayOpen() && key === '0') { e.preventDefault(); resetPlayZoom() }
  })

  function selectedWord() {
    const ta = focusedEd().el
    const sel = ta.value.slice(ta.selectionStart, ta.selectionEnd)
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

  function doSearchAll(q) {
    const out = []
    if (!q) return out
    for (const d of state.docs) {
      let shown = 0
      let off = 0
      const lines = d.content.split('\n')
      for (let li = 0; li < lines.length; li++) {
        const ln = lines[li]
        let i = ln.indexOf(q)
        while (i >= 0 && shown < 10 && out.length < 100) {
          shown++
          out.push({
            id: d.id,
            name: `${d.fileName}${d.dirty ? ' ●' : ''} · Ln ${li + 1}`,
            hint: `${shown}`,
            preview: ln.trim().slice(0, 60),
            off: off + i,
            qlen: q.length,
          })
          i = ln.indexOf(q, i + Math.max(1, q.length))
        }
        off += ln.length + 1
        if (shown >= 10 || out.length >= 100) break
      }
    }
    return out
  }

  function doGotoMatch(it) {
    switchTab(it.id)
    const ta = focusedEd().el
    ta.focus()
    ta.setSelectionRange(it.off, it.off + it.qlen)
    const lh = parseFloat(getComputedStyle(ta).lineHeight) || 22
    const scroller = ta.offsetParent ?? ta
    const line = +(it.name.match(/Ln (\d+)/)?.[1] ?? 1)
    scroller.scrollTop = Math.max(0, (line - 1) * lh - scroller.clientHeight / 2)
  }

  async function doOpenPaths(paths, acceptAll = false) {
    const inPlay = document.body.classList.contains('play')
    const files = paths.filter((x) => acceptAll || /\.(txt|md|markdown|html|css|js)$/i.test(x)).slice(0, 8)
    for (const p of files) {
      if (inPlay) {
        const m = /\.([^.]+)$/.exec(p)
        const lang = { html: 'html', css: 'css', js: 'js' }[m?.[1]?.toLowerCase()]
        if (!lang) continue
        const r = await openPath(p)
        if (r) loadInto(lang, r.content)
        continue
      }
      const r = await openPath(p)
      if (!r) continue
      adoptFile(editor, r)
      pushRecent(r.filePath)
    }
  }

  async function doPlayTemplate(id) {    ensurePlay()
    if (!buffersEmpty()) {
      const c = await confirmModal({
        title: t('cf.tplTitle'),
        message: t('cf.tplMsg'),
        buttons: [
          { label: t('cf.cancel'), value: 'cancel' },
          { label: t('cf.apply'), value: 'apply', primary: true },
        ],
      })
      if (c !== 'apply') return
    }
    applyTemplate(id)
  }

  async function doSave() {
    if (isPlayOpen()) return doSavePane()
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
    if (isPlayOpen()) return doSavePane()
    const r = await saveFileAs(editor, activeDoc().fileName)
    if (!r) return
    setFilePath(r.filePath || '')
    if (!r.filePath) activeDoc().fileName = r.fileName
    setDirty(false)
    pushRecent(r.filePath)
    noteSaved(r.filePath)
  }

  // Guarda lo guardable (con ruta y cambios); los untitled se omiten.
  async function doSaveAll() {
    if (!window.go?.main?.App) return
    for (const d of state.docs) {
      if (!d.filePath || !d.dirty) continue
      const content = d.id === state.activeId ? editor.getValue() : d.content
      try {
        await window.go.main.App.WriteFile(d.filePath, content)
        d.content = content
        if (d.id === state.activeId) setDirty(false)
        else d.dirty = false
        pushRecent(d.filePath)
        noteSaved(d.filePath)
      } catch { /* sigue con el resto */ }
    }
    setDirty(activeDoc().dirty)
  }

  async function doCloseOthers() {
    const keep = activeDoc().id
    for (const d of [...state.docs]) {
      if (d.id === keep) continue
      if (d.dirty) {
        const c = await confirmModal({
          title: d.fileName,
          message: t('cf.unsaved'),
          buttons: [
            { label: t('cf.skip'), value: 'skip' },
            { label: t('cf.discard'), value: 'discard', primary: true },
          ],
        })
        if (c == null) return
        if (c !== 'discard') continue
      }
      removeDoc(d.id)
    }
  }

  async function doPlayExternal() {
    const html = buildSrcdoc()
    if (window.go?.main?.App) {
      try {
        await window.go.main.App.PreviewExternal(html)
      } catch { /* diálogo cancelado o disco lleno */ }
      return
    }
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }))
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 60000)
  }

  async function doPlayExportZip() {
    ensurePlay()
    if (!window.go?.main?.App) return
    const b = getBuffers()
    try {
      await window.go.main.App.ExportZip(b.html, b.css, b.js)
    } catch { /* diálogo cancelado */ }
  }

  // Un solo .html con CSS/JS inline (se abre en cualquier navegador).
  async function doPlayExportSingle() {
    ensurePlay()
    try {
      await saveExportFile('playground.html', buildSrcdoc())
    } catch { /* diálogo cancelado */ }
  }

  // El Markdown renderizado como .html autónomo con los colores del tema.
  async function doExportMD() {
    const d = activeDoc()
    const base = (d.fileName || t('export.doc')).replace(/\.[^.]*$/, '') || t('export.doc')
    try {
      await saveExportFile(`${base}.html`, preview.exportHTML(d.fileName))
    } catch { /* diálogo cancelado */ }
  }

  // En playground Ctrl+S/Ctrl+Shift+S exportan el pane enfocado a disco.
  const PLAY_NAMES = { html: 'index.html', css: 'style.css', js: 'app.js' }
  async function doSavePane() {
    const p = playPaneEditor()
    if (!p) return
    await saveFileAs(p, PLAY_NAMES[playPaneLang()] || 'untitled.txt')
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
