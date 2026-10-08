export function initPalette(editor, actions) {
  const root = document.getElementById('cmd')
  const input = document.getElementById('cmd-input')
  const replace = document.getElementById('cmd-replace')
  const list = document.getElementById('cmd-list')
  const count = document.getElementById('cmd-count')
  const textarea = editor.el
  let mode = 'commands'
  let matches = []
  let index = 0
  let sel = 0

  const commands = [
    { name: 'Nuevo documento', keys: 'Ctrl+N', run: actions.new },
    { name: 'Abrir archivo…', keys: 'Ctrl+O', run: actions.open },
    { name: 'Guardar', keys: 'Ctrl+S', run: actions.save },
    { name: 'Guardar como…', keys: 'Ctrl+Shift+S', run: actions.saveAs },
    { name: 'Buscar en el documento…', keys: 'Ctrl+F', run: () => open('find') },
    { name: 'Reemplazar en el documento…', keys: 'Ctrl+H', run: () => open('replace') },
    { name: 'Ir a la línea…', keys: 'Ctrl+G', run: () => open('goto') },
    { name: 'Ir a encabezado…', keys: '', run: () => open('headings') },
    { name: 'Negrita', keys: 'Ctrl+B', run: () => editor.toggleWrap('**') },
    { name: 'Cursiva', keys: 'Ctrl+I', run: () => editor.toggleWrap('*') },
    { name: 'Tachado', keys: 'Ctrl+Shift+X', run: () => editor.toggleWrap('~~') },
    { name: 'Pestañas…', keys: '', run: () => open('tabs') },
    { name: 'Ver pestañas en grid…', keys: 'Ctrl+Shift+Tab', run: () => actions.openGrid() },
    { name: 'Reabrir pestaña cerrada', keys: 'Ctrl+Shift+T', run: () => actions.reopenTab() },
    { name: 'Abrir reciente…', keys: '', run: () => open('recent') },
    { name: 'Ajuste de línea', keys: 'Alt+Z', run: () => actions.toggleWrap() },
    { name: 'MAYÚSCULAS', keys: '', run: () => actions.toUpper() },
    { name: 'minúsculas', keys: '', run: () => actions.toLower() },
    { name: 'Unir líneas', keys: 'Ctrl+J', run: () => actions.joinLines() },
    { name: 'Ordenar líneas', keys: '', run: () => actions.sortLines() },
    { name: 'Formatear tabla', keys: '', run: () => actions.formatTable() },
    { name: 'Copiar ruta del archivo', keys: '', run: () => actions.copyPath() },
    { name: 'Sintaxis Markdown…', keys: '', run: () => actions.showSyntax() },
    { name: 'Modo zen', keys: 'F11', run: () => actions.toggleZen() },
    { name: 'Vista previa Markdown', keys: 'Ctrl+Shift+V', run: () => actions.togglePreview() },
    { name: 'Playground web', keys: '', run: () => actions.togglePlay() },
    { name: 'Configuración…', keys: 'Ctrl+,', run: actions.settings },
    { name: 'Cerrar', keys: 'Ctrl+W', run: actions.close },
  ]

  input.addEventListener('input', () => {
    if (mode === 'find' || mode === 'replace') runFind()
    else if (mode === 'tabs') renderTabs()
    else if (mode === 'recent') renderRecent()
    else if (mode === 'headings') renderHeadings()
    else renderList()
  })

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); close() }
    else if ((mode === 'commands' || mode === 'tabs' || mode === 'recent' || mode === 'headings') && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault()
      moveSel(e.key === 'ArrowDown' ? 1 : -1)
    }
    else if (e.key === 'Enter') {
      e.preventDefault()
      if (mode === 'commands') runSelected()
      else if (mode === 'recent') runSelectedRecent()
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
    root.hidden = false
    replace.hidden = next !== 'replace'
    list.hidden = next !== 'commands' && next !== 'tabs' && next !== 'recent' && next !== 'headings'
    count.textContent = ''
    input.value = preset
    input.placeholder =
      next === 'find' ? 'Buscar' :
      next === 'replace' ? 'Buscar' :
      next === 'goto' ? 'Número de línea' :
      next === 'tabs' ? 'Buscar pestaña…' :
      next === 'headings' ? 'Buscar encabezado…' :
      next === 'recent' ? 'Abrir reciente…' : 'Escribe un comando…'
    if (next === 'commands') { sel = 0; renderList() }
    else if (next === 'tabs') { sel = 0; renderTabs() }
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
    editor.focus()
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
    const name = document.createElement('span')
    name.textContent = c.name
    li.appendChild(name)
    if (c.keys) {
      const keys = document.createElement('span')
      keys.className = 'keys'
      keys.textContent = c.keys
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
        list.appendChild(headLi('Recientes'))
        for (const c of rec) {
          list.appendChild(commandLi(c))
          items.push(c)
        }
      }
    }
    const rest = q ? matches : matches.filter((c) => !items.includes(c))
    if (!q && items.length && rest.length) list.appendChild(headLi('Comandos'))
    for (const c of rest) {
      list.appendChild(commandLi(c))
      items.push(c)
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

  function runFind() {
    const q = input.value
    const v = textarea.value
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
    textarea.focus()
    textarea.setSelectionRange(pos, pos + input.value.length)
    count.textContent = `${index + 1}/${matches.length}`
    input.focus()
  }

  function step(d) {
    if (matches.length) selectMatch(index + d)
  }

  function doReplace(all) {
    const q = input.value
    if (!q) return
    const r = replace.value ?? ''
    if (all) {
      textarea.setRangeText(textarea.value.split(q).join(r), 0, textarea.value.length, 'select')
    } else if (matches.length) {
      const pos = matches[index]
      textarea.setRangeText(r, pos, pos + q.length, 'select')
    }
    textarea.dispatchEvent(new Event('input', { bubbles: true }))
    runFind()
  }

  function goToLine() {
    gotoLineNumber(parseInt(input.value, 10))
  }

  function gotoLineNumber(n) {
    const total = editor.lineCount()
    if (!Number.isFinite(n)) return
    const line = Math.min(Math.max(1, n), total)
    const v = textarea.value
    let off = 0
    for (let l = 1; l < line; l++) {
      const i = v.indexOf('\n', off)
      if (i < 0) { off = v.length; break }
      off = i + 1
    }
    close()
    textarea.focus()
    textarea.setSelectionRange(off, off)
    const lh = parseFloat(getComputedStyle(textarea).lineHeight) || 22
    textarea.scrollTop = Math.max(0, (line - 1) * lh - textarea.clientHeight / 2)
  }

  function renderHeadings() {
    const q = input.value.toLowerCase()
    const items = []
    textarea.value.split('\n').forEach((ln, i) => {
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
