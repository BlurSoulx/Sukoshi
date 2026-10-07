import { state, activeDoc, tabInfo, addDoc, removeDoc, setActive, setDirty } from './state.js'

let editor = null

export function setupTabs(ed) {
  editor = ed
  // Clic fuera de las cards cierra sin cambiar.
  document.getElementById('tabgrid')?.addEventListener('click', (e) => {
    if (e.target.id === 'tabgrid') closeGrid()
  })
  // Estilo Windows: al soltar Ctrl/Shift con el grid abierto se confirma la selección.
  document.addEventListener('keyup', (e) => {
    if (!isGridOpen()) return
    if ((e.key === 'Control' || e.key === 'Shift') && !e.ctrlKey && !e.shiftKey) {
      document.querySelector('#tabgrid-cards button.sel')?.click()
    }
  })
  document.addEventListener('keydown', (e) => {
    if (!isGridOpen()) return
    if (e.key === 'Escape') { e.preventDefault(); closeGrid() }
    else if (e.key === 'Enter') {
      e.preventDefault()
      document.querySelector('#tabgrid-cards button.sel')?.click()
    }
    else if (e.key === 'Tab' || e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      moveGrid(1)
    }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      moveGrid(-1)
    }
  })
}

export function isGridOpen() {
  return document.getElementById('tabgrid')?.hidden === false
}

export function openGrid(next = false) {
  const root = document.getElementById('tabgrid')
  const wrap = document.getElementById('tabgrid-cards')
  wrap.innerHTML = ''
  const list = tabList()
  list.forEach((t, i) => {
    const b = document.createElement('button')
    b.className = 'tabcard' + (t.active ? ' active sel' : '')
    b.dataset.id = t.id
    const name = document.createElement('strong')
    name.textContent = t.name
    const idx = document.createElement('em')
    idx.textContent = t.hint
    const prev = document.createElement('span')
    prev.textContent = state.docs[i].content.split('\n').slice(0, 3).join('\n').slice(0, 140) || '—'
    b.append(name, idx, prev)
    b.addEventListener('click', () => {
      closeGrid()
      switchTab(+b.dataset.id)
    })
    wrap.appendChild(b)
  })
  root.hidden = false
  if (next && list.length > 1) moveGrid(1)
  wrap.querySelector('button.sel')?.focus()
}

export function closeGrid() {
  document.getElementById('tabgrid').hidden = true
  editor.focus()
}

function moveGrid(d) {
  const cards = [...document.querySelectorAll('#tabgrid-cards button')]
  if (!cards.length) return
  let i = cards.findIndex((c) => c.classList.contains('sel'))
  i = (i + d + cards.length) % cards.length
  cards.forEach((c) => c.classList.remove('sel'))
  cards[i].classList.add('sel')
  cards[i].focus()
}

function toast() {
  const { index, total } = tabInfo()
  const d = activeDoc()
  const el = document.getElementById('toast')
  if (!el) return
  el.textContent = `${d.fileName}${d.dirty ? ' ●' : ''} · ${index}/${total}`
  el.hidden = false
  void el.offsetWidth
  el.classList.remove('show')
  el.classList.add('show')
  clearTimeout(toast._t)
  toast._t = setTimeout(() => { el.hidden = true }, 1400)
}

function showDoc(d) {
  editor.setValue(d.content)
  editor.el.setSelectionRange(d.sel || 0, d.sel || 0)
  setDirty(d.dirty)
  editor.focus()
}

export function switchTab(id) {
  if (id === state.activeId) return
  const cur = activeDoc()
  if (cur) cur.sel = editor.cursorOffset()
  setActive(id)
  showDoc(activeDoc())
  toast()
}

export function cycleTab(dir) {
  if (state.docs.length < 2) return
  const i = state.docs.findIndex((d) => d.id === state.activeId)
  const next = state.docs[(i + dir + state.docs.length) % state.docs.length]
  switchTab(next.id)
}

export function newTab() {
  const cur = activeDoc()
  if (cur) cur.sel = editor.cursorOffset()
  showDoc(addDoc())
  toast()
}

export function closeTab() {
  const d = activeDoc()
  if (d.dirty && !confirm(`"${d.fileName}" tiene cambios sin guardar. ¿Cerrar pestaña?`)) {
    return 'cancelled'
  }
  const wasLast = state.docs.length === 1
  if (wasLast) return 'quit'
  removeDoc(d.id)
  showDoc(activeDoc())
  toast()
  return 'closed'
}

export function tabList() {
  const { index } = tabInfo()
  return state.docs.map((d, i) => ({
    id: d.id,
    name: `${d.fileName}${d.dirty ? ' ●' : ''}`,
    hint: `${i + 1}/${state.docs.length}`,
    active: i + 1 === index,
  }))
}

// Abrir reutiliza la pestaña solo si está virgen (vacía, sin archivo ni cambios).
export function pristineTab() {
  const d = activeDoc()
  return !d.dirty && !d.filePath && editor.getValue() === ''
}
