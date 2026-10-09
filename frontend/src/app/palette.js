import { iconSVG } from './icons.js'
import { t } from './i18n.js'

export function initPalette(getEd, actions) {
  const ed = () => getEd()
  const ta = () => ed().el
  const root = document.getElementById('cmd')
  const input = document.getElementById('cmd-input')
  const replace = document.getElementById('cmd-replace')
  const list = document.getElementById('cmd-list')
  const count = document.getElementById('cmd-count')
  let mode = 'commands'
  let matches = []
  let index = 0
  let sel = 0

  const GROUPS = ['file', 'edit', 'tabs', 'play', 'view', 'app']
  // Los nombres se generan al abrir (siguen al idioma activo).
  let commands = []
  const buildCommands = () => [
    { name: t('cmd.new'), keys: 'Ctrl+N', g: 'file', icon: 'file-plus', run: actions.new },
    { name: t('cmd.open'), keys: 'Ctrl+O', g: 'file', icon: 'folder', run: actions.open },
    { name: t('cmd.save'), keys: 'Ctrl+S', g: 'file', icon: 'save', run: actions.save },
    { name: t('cmd.saveAs'), keys: 'Ctrl+Shift+S', g: 'file', icon: 'copy', run: actions.saveAs },
    { name: t('cmd.saveAll'), keys: '', g: 'file', icon: 'save', run: () => actions.saveAll() },
    { name: t('cmd.closeOthers'), keys: '', g: 'tabs', icon: 'minus', run: () => actions.closeOthers() },
    { name: t('cmd.openRecent'), keys: '', g: 'file', icon: 'clock', run: () => open('recent') },
    { name: t('cmd.find'), keys: 'Ctrl+F', g: 'edit', icon: 'search', run: () => open('find') },
    { name: t('cmd.findAll'), keys: 'Ctrl+Shift+F', g: 'edit', icon: 'search', run: () => open('all') },
    { name: t('cmd.replace'), keys: 'Ctrl+H', g: 'edit', icon: 'repeat', run: () => open('replace') },
    { name: t('cmd.goto'), keys: 'Ctrl+G', g: 'edit', icon: 'hash', run: () => open('goto') },
    { name: t('cmd.headings'), keys: '', g: 'edit', icon: 'list', run: () => open('headings') },
    { name: t('cmd.bold'), keys: 'Ctrl+B', g: 'edit', icon: 'bold', run: () => ed().toggleWrap('**') },
    { name: t('cmd.italic'), keys: 'Ctrl+I', g: 'edit', icon: 'italic', run: () => ed().toggleWrap('*') },
    { name: t('cmd.strike'), keys: 'Ctrl+Shift+X', g: 'edit', icon: 'strike', run: () => ed().toggleWrap('~~') },
    { name: t('cmd.upper'), keys: '', g: 'edit', icon: 'type', run: () => actions.toUpper() },
    { name: t('cmd.lower'), keys: '', g: 'edit', icon: 'type', run: () => actions.toLower() },
    { name: t('cmd.join'), keys: 'Ctrl+J', g: 'edit', icon: 'minus', run: () => actions.joinLines() },
    { name: t('cmd.sort'), keys: '', g: 'edit', icon: 'sort', run: () => actions.sortLines() },
    { name: t('cmd.table'), keys: '', g: 'edit', icon: 'table', run: () => actions.formatTable() },
    { name: t('cmd.comment'), keys: 'Ctrl+.', g: 'edit', icon: 'code', run: () => actions.toggleComment() },
    { name: t('cmd.undo'), keys: 'Ctrl+Z', g: 'edit', icon: 'rotate-ccw', run: () => actions.undo() },
    { name: t('cmd.redo'), keys: 'Ctrl+Shift+Z', g: 'edit', icon: 'refresh', run: () => actions.redo() },
    { name: t('cmd.copyPath'), keys: '', g: 'edit', icon: 'clipboard', run: () => actions.copyPath() },
    { name: t('cmd.wrap'), keys: 'Alt+Z', g: 'edit', icon: 'align-left', run: () => actions.toggleWrap() },
    { name: t('cmd.tabs'), keys: '', g: 'tabs', icon: 'copy', run: () => open('tabs') },
    { name: t('cmd.grid'), keys: 'Ctrl+Shift+Tab', g: 'tabs', icon: 'grid', run: () => actions.openGrid() },
    { name: t('cmd.reopen'), keys: 'Ctrl+Shift+T', g: 'tabs', icon: 'rotate-ccw', run: () => actions.reopenTab() },
    { name: t('cmd.tpl'), keys: '', g: 'play', icon: 'file-text', run: () => open('playtpl') },
    { name: t('cmd.syntax'), keys: '', g: 'view', icon: 'book-open', run: () => actions.showSyntax() },
    { name: t('cmd.shortcuts'), keys: 'F1', g: 'view', icon: 'keyboard', run: () => actions.showShortcuts() },
    { name: t('cmd.exportMD'), keys: '', g: 'view', icon: 'download', run: () => actions.exportMD() },
    { name: t('cmd.zen'), keys: 'F11', g: 'view', icon: 'moon', run: () => actions.toggleZen() },
    { name: t('cmd.mdPreview'), keys: 'Ctrl+Shift+V', g: 'view', icon: 'eye', run: () => actions.togglePreview() },
    { name: t('cmd.play'), keys: 'Ctrl+`', g: 'view', icon: 'code', run: () => actions.togglePlay() },
    { name: t('cmd.external'), keys: '', g: 'view', icon: 'external', run: () => actions.playExternal() },
    { name: t('cmd.zip'), keys: '', g: 'view', icon: 'archive', run: () => actions.playExportZip() },
    { name: t('cmd.single'), keys: '', g: 'view', icon: 'download', run: () => actions.playExportSingle() },
    { name: t('cmd.settings'), keys: 'Ctrl+,', g: 'app', icon: 'settings', run: actions.settings },
    { name: t('cmd.close'), keys: 'Ctrl+W', g: 'app', icon: 'x', run: actions.close },
  ]

  input.addEventListener('input', () => {
    if (mode === 'find' || mode === 'replace') runFind()
    else if (mode === 'tabs') renderTabs()
    else if (mode === 'recent') renderRecent()
    else if (mode === 'all') renderAll()
    else if (mode === 'playtpl') renderPlayTpl()
    else if (mode === 'headings') renderHeadings()
    else renderList()
  })

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); close() }
    else if ((mode === 'commands' || mode === 'tabs' || mode === 'recent' || mode === 'headings' || mode === 'playtpl' || mode === 'all') && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault()
      moveSel(e.key === 'ArrowDown' ? 1 : -1)
    }
    else if (e.key === 'Enter') {
      e.preventDefault()
      if (mode === 'commands') runSelected()
      else if (mode === 'recent') runSelectedRecent()
      else if (mode === 'all') runSelectedAll()
      else if (mode === 'playtpl') runSelectedPlayTpl()
      else if (mode === 'headings') runSelectedHeading()
      else if (mode === 'tabs') runSelectedTab()
      else if (mode === 'goto') goToLine()
      else if (mode === 'find') step(e.shiftKey ? -1 : 1)
      else if (mode === 'replace') doReplace(e.ctrlKey || e.metaKey)
    }
  })

  replace.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); close() }
    else if (e.key === 'Enter') { e.preventDefault(); doReplace(e.ctrlKey || e.metaKey) }
    else if (e.key === 'Tab' && !e.ctrlKey && !e.metaKey) {
      // Tab alterna entre ambos campos sin salir de la barra.
      e.preventDefault()
      input.focus()
    }
  })

  function open(next, preset = '') {
    mode = next
    commands = buildCommands()
    root.hidden = false
    replace.hidden = next !== 'replace'
    list.hidden = next !== 'commands' && next !== 'tabs' && next !== 'recent' && next !== 'headings' && next !== 'playtpl' && next !== 'all'
    count.textContent = ''
    input.value = preset
    input.placeholder =
      next === 'find' ? t('ph.find') :
      next === 'replace' ? t('ph.find') :
      next === 'goto' ? t('ph.goto') :
      next === 'tabs' ? t('ph.tabs') :
      next === 'headings' ? t('ph.headings') :
      next === 'playtpl' ? t('ph.playtpl') :
      next === 'all' ? t('ph.all') :
      next === 'recent' ? t('ph.recent') : t('ph.commands')
    if (next === 'commands') { sel = 0; renderList() }
    else if (next === 'tabs') { sel = 0; renderTabs() }
    else if (next === 'all') { sel = 0; renderAll() }
    else if (next === 'playtpl') { sel = 0; renderPlayTpl() }
    else if (next === 'headings') { sel = 0; renderHeadings() }
    else if (next === 'recent') { sel = 0; renderRecent() }
    else if (next === 'find' || next === 'replace') runFind()
    input.focus()
    input.select()
  }

  function close() {
    root.hidden = true
    input.value = ''
    replace.value = ''
    ed().focus()
  }

  function visible() {
    return !root.hidden
  }

  let recentCmds = []

  function trackRecent(name) {
    recentCmds = [name, ...recentCmds.filter((n) => n !== name)].slice(0, 5)
  }

  function commandLi(c) {
    const li = document.createElement('li')
    if (c.icon) {
      const ic = document.createElement('span')
      ic.className = 'mic'
      ic.innerHTML = iconSVG(c.icon)
      li.appendChild(ic)
    }
    const name = document.createElement('span')
    name.textContent = c.name
    li.appendChild(name)
      if (c.keys) {
        const keys = document.createElement('span')
        keys.className = 'keys'
        c.keys.split('+').forEach((part, i) => {
          if (i > 0) keys.append('+')
          const k = document.createElement('kbd')
          k.textContent = part.trim()
          keys.appendChild(k)
        })
        li.appendChild(keys)
      }
    li.addEventListener('click', () => { trackRecent(c.name); close(); c.run() })
    return li
  }

  function headLi(label) {
    const li = document.createElement('li')
    li.className = 'head'
    li.textContent = label
    return li
  }

  function renderList() {
    const q = input.value.toLowerCase()
    const matches = commands.filter((c) => c.name.toLowerCase().includes(q))
    const items = []
    list.innerHTML = ''
    if (!q) {
      const rec = recentCmds
        .map((n) => commands.find((c) => c.name === n))
        .filter((c) => c && matches.includes(c))
      if (rec.length) {
        list.appendChild(headLi(t('group.recent')))
        for (const c of rec) {
          list.appendChild(commandLi(c))
          items.push(c)
        }
      }
    }
    const rest = q ? matches : matches.filter((c) => !items.includes(c))
    if (!q) {
      let headed = items.length > 0
      for (const g of GROUPS) {
        const members = rest.filter((c) => c.g === g)
        if (!members.length) continue
        if (headed) list.appendChild(headLi(t(`group.${g}`)))
        headed = true
        for (const c of members) {
          list.appendChild(commandLi(c))
          items.push(c)
        }
      }
    } else {
      for (const c of rest) {
        list.appendChild(commandLi(c))
        items.push(c)
      }
    }
    sel = Math.min(sel, Math.max(0, items.length - 1))
    paintSel(items)
    list._items = items
  }

  function moveSel(d) {
    const items = list._items ?? []
    if (!items.length) return
    sel = (sel + d + items.length) % items.length
    paintSel(items)
  }

  function paintSel(items) {
    const rows = [...list.querySelectorAll('li:not(.head)')]
    rows.forEach((li, i) => li.classList.toggle('active', i === sel))
    rows[sel]?.scrollIntoView({ block: 'nearest' })
  }

  function runSelected() {
    const c = list._items?.[sel]
    if (!c) return
    trackRecent(c.name)
    close()
    c.run()
  }

  function renderTabs() {
    const q = input.value.toLowerCase()
    const items = actions.listTabs().filter((t) => t.name.toLowerCase().includes(q))
    sel = Math.min(sel, Math.max(0, items.length - 1))
    list.innerHTML = ''
    for (const t of items) {
      const li = document.createElement('li')
      li.textContent = `${t.name} · ${t.hint}`
      li.addEventListener('click', () => { close(); actions.gotoTab(t.id) })
      list.appendChild(li)
    }
    paintSel(items)
    list._items = items
  }

  function runSelectedTab() {
    const t = list._items?.[sel]
    if (!t) return
    close()
    actions.gotoTab(t.id)
  }

  function renderRecent() {
    const q = input.value.toLowerCase()
    const items = actions.listRecents().filter((r) =>
      r.name.toLowerCase().includes(q) || r.path.toLowerCase().includes(q))
    sel = Math.min(sel, Math.max(0, items.length - 1))
    list.innerHTML = ''
    for (const r of items) {
      const li = document.createElement('li')
      li.textContent = r.name
      li.title = r.path
      li.addEventListener('click', () => { close(); actions.openRecent(r.path) })
      list.appendChild(li)
    }
    paintSel(items)
    list._items = items
  }

  function runSelectedRecent() {
    const r = list._items?.[sel]
    if (!r) return
    close()
    actions.openRecent(r.path)
  }

  function renderAll() {
    const items = actions.searchAll(input.value)
    sel = Math.min(sel, Math.max(0, items.length - 1))
    list.innerHTML = ''
    for (const it of items) {
      const li = document.createElement('li')
      const name = document.createElement('span')
      name.textContent = it.name
      li.appendChild(name)
      if (it.preview) {
        const pv = document.createElement('span')
        pv.className = 'keys'
        pv.textContent = it.preview
        pv.title = it.preview
        li.appendChild(pv)
      }
      li.addEventListener('click', () => { close(); actions.gotoMatch(it) })
      list.appendChild(li)
    }
    paintSel(items)
    list._items = items
  }

  function runSelectedAll() {
    const it = list._items?.[sel]
    if (!it) return
    close()
    actions.gotoMatch(it)
  }

  function renderPlayTpl() {
    const q = input.value.toLowerCase()
    const items = actions.playTemplates().filter((t) => t.name.toLowerCase().includes(q))
    sel = Math.min(sel, Math.max(0, items.length - 1))
    list.innerHTML = ''
    for (const t of items) {
      const li = document.createElement('li')
      li.textContent = t.name
      li.addEventListener('click', () => { close(); actions.playTemplate(t.id) })
      list.appendChild(li)
    }
    paintSel(items)
    list._items = items
  }

  function runSelectedPlayTpl() {
    const t = list._items?.[sel]
    if (!t) return
    close()
    actions.playTemplate(t.id)
  }

  function runFind() {
    const q = input.value
    const v = ta().value
    matches = []
    index = 0
    if (!q) { count.textContent = ''; return }
    let i = v.indexOf(q)
    while (i >= 0 && matches.length < 5000) {
      matches.push(i)
      i = v.indexOf(q, i + Math.max(1, q.length))
    }
    if (matches.length) selectMatch(0)
    else count.textContent = '0/0'
  }

  function selectMatch(i) {
    index = (i + matches.length) % matches.length
    const pos = matches[index]
    const t = ta()
    t.focus()
    t.setSelectionRange(pos, pos + input.value.length)
    count.textContent = `${index + 1}/${matches.length}`
    input.focus()
  }

  function step(d) {
    if (matches.length) selectMatch(index + d)
  }

  function doReplace(all) {
    const q = input.value
    if (!q) return
    const t = ta()
    const r = replace.value ?? ''
    if (all) {
      t.setRangeText(t.value.split(q).join(r), 0, t.value.length, 'select')
    } else if (matches.length) {
      const pos = matches[index]
      t.setRangeText(r, pos, pos + q.length, 'select')
    }
    t.dispatchEvent(new Event('input', { bubbles: true }))
    runFind()
  }

  function goToLine() {
    gotoLineNumber(parseInt(input.value, 10))
  }

  function gotoLineNumber(n) {
    const total = ed().lineCount()
    if (!Number.isFinite(n)) return
    const line = Math.min(Math.max(1, n), total)
    const v = ta().value
    let off = 0
    for (let l = 1; l < line; l++) {
      const i = v.indexOf('\n', off)
      if (i < 0) { off = v.length; break }
      off = i + 1
    }
    close()
    const t = ta()
    t.focus()
    t.setSelectionRange(off, off)
    const lh = parseFloat(getComputedStyle(t).lineHeight) || 22
    const scroller = t.offsetParent ?? t
    scroller.scrollTop = Math.max(0, (line - 1) * lh - scroller.clientHeight / 2)
  }

  function renderHeadings() {
    const q = input.value.toLowerCase()
    const items = []
    ta().value.split('\n').forEach((ln, i) => {
      const m = ln.match(/^(#{1,6})\s+(.*\S)/)
      if (m && m[2].toLowerCase().includes(q)) items.push({ line: i + 1, level: m[1].length, text: m[2] })
    })
    sel = Math.min(sel, Math.max(0, items.length - 1))
    list.innerHTML = ''
    for (const h of items) {
      const li = document.createElement('li')
      const pad = document.createElement('span')
      pad.textContent = `${'#'.repeat(h.level)} ${h.text}`
      li.appendChild(pad)
      const ln = document.createElement('span')
      ln.className = 'keys'
      ln.textContent = h.line
      li.appendChild(ln)
      li.addEventListener('click', () => gotoLineNumber(h.line))
      list.appendChild(li)
    }
    paintSel(items)
    list._items = items
  }

  function runSelectedHeading() {
    const h = list._items?.[sel]
    if (!h) return
    gotoLineNumber(h.line)
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && visible() && document.activeElement !== input && document.activeElement !== replace) {
      close()
    }
  })

  return { open, close, visible }
}
