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
    { name: 'Nuevo documento', run: actions.new },
    { name: 'Abrir archivo…', run: actions.open },
    { name: 'Guardar', run: actions.save },
    { name: 'Guardar como…', run: actions.saveAs },
    { name: 'Buscar en el documento…', run: () => open('find') },
    { name: 'Reemplazar en el documento…', run: () => open('replace') },
    { name: 'Ir a la línea…', run: () => open('goto') },
    { name: 'Negrita', run: () => editor.toggleWrap('**') },
    { name: 'Cursiva', run: () => editor.toggleWrap('*') },
    { name: 'Tachado', run: () => editor.toggleWrap('~~') },
    { name: 'Pestañas…', run: () => open('tabs') },
    { name: 'Ver pestañas en grid…', run: () => actions.openGrid() },
    { name: 'Configuración…', run: actions.settings },
    { name: 'Cerrar', run: actions.close },
  ]

  input.addEventListener('input', () => {
    if (mode === 'find' || mode === 'replace') runFind()
    else if (mode === 'tabs') renderTabs()
    else renderList()
  })

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); close() }
    else if (mode === 'commands' && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault()
      moveSel(e.key === 'ArrowDown' ? 1 : -1)
    }
    else if (mode === 'tabs' && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault()
      moveSel(e.key === 'ArrowDown' ? 1 : -1)
    }
    else if (e.key === 'Enter') {
      e.preventDefault()
      if (mode === 'commands') runSelected()
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
    list.hidden = next !== 'commands' && next !== 'tabs'
    count.textContent = ''
    input.value = preset
    input.placeholder =
      next === 'find' ? 'Buscar' :
      next === 'replace' ? 'Buscar' :
      next === 'goto' ? 'Número de línea' :
      next === 'tabs' ? 'Buscar pestaña…' : 'Escribe un comando…'
    if (next === 'commands') { sel = 0; renderList() }
    else if (next === 'tabs') { sel = 0; renderTabs() }
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

  function renderList() {
    const q = input.value.toLowerCase()
    const items = commands.filter((c) => c.name.toLowerCase().includes(q))
    sel = Math.min(sel, Math.max(0, items.length - 1))
    list.innerHTML = ''
    for (const c of items) {
      const li = document.createElement('li')
      li.textContent = c.name
      li.addEventListener('click', () => { close(); c.run() })
      list.appendChild(li)
    }
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
    for (let i = 0; i < list.children.length; i++) {
      list.children[i].classList.toggle('active', i === sel)
    }
    list.children[sel]?.scrollIntoView({ block: 'nearest' })
  }

  function runSelected() {
    const c = list._items?.[sel]
    if (!c) return
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
    const n = parseInt(input.value, 10)
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

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && visible() && document.activeElement !== input && document.activeElement !== replace) {
      close()
    }
  })

  return { open, close, visible }
}
