import { state, activeDoc, tabInfo, addDoc, removeDoc, setActive, setDirty, mruNextId } from './state.js'
import { confirmModal } from './modal.js'
import { t } from './i18n.js'

let editor = null
const closedStack = []
let toastTimer = 0

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
    const doc = state.docs[i]
    const lines = doc.content.split('\n')
    const b = document.createElement('button')
    b.className = 'tabcard' + (t.active ? ' active sel' : '')
    b.dataset.id = t.id
    const body = document.createElement('span')
    body.className = 'tabcard-body'
    const file = document.createElement('span')
    file.className = 'tab-file'
    file.textContent = `${doc.fileName}${doc.dirty ? ' ●' : ''}`
    const title = document.createElement('span')
    title.className = 'tab-title'
    title.textContent = lines[0] || '—'
    const prev = document.createElement('span')
    prev.className = 'tab-prev'
    prev.textContent = lines.slice(1, 4).join('\n').slice(0, 140) || '—'
    const idx = document.createElement('span')
    idx.className = 'tab-idx'
    idx.textContent = t.hint
    body.append(file, title, prev, idx)
    b.append(body)
    b.addEventListener('click', () => {
      closeGrid()
      switchTab(+b.dataset.id)
    })
    wrap.appendChild(b)
  })
  root.hidden = false
  if (next && list.length > 1) {
    const cards = [...wrap.querySelectorAll('button')]
    const target = cards.find((c) => +c.dataset.id === mruNextId()) ?? cards[1]
    cards.forEach((c) => c.classList.remove('sel'))
    target.classList.add('sel')
    target.focus()
    return
  }
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

export function toastDoc() {
  const d = activeDoc()
  const { index, total } = tabInfo()
  const el = document.getElementById('toast')
  if (!el) return
  el.innerHTML = ''
  const name = document.createElement('b')
  name.textContent = `${d.fileName}${d.dirty ? ' ●' : ''}`
  const info = document.createElement('span')
  info.textContent = `· ${index}/${total} · ${d.content.split('\n').length} ${t('ft.lines')}`
  el.append(name, info)
  el.hidden = false
  el.classList.remove('show')
  void el.offsetWidth
  el.classList.add('show')
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { el.hidden = true }, 1400)
}

export function showDoc(d) {
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
  toastDoc()
}

export function cycleTab() {
  if (state.docs.length < 2) return
  switchTab(mruNextId())
}

export function newTab() {
  const cur = activeDoc()
  if (cur) cur.sel = editor.cursorOffset()
  showDoc(addDoc())
  toastDoc()
}

export async function closeTab(saveFn) {
  const d = activeDoc()
  if (d.dirty) {
    const choice = await confirmModal({
      title: d.fileName,
      message: t('cf.unsaved'),
      buttons: [
        { label: t('cf.cancel'), value: 'cancel' },
        { label: t('cf.discard'), value: 'discard' },
        { label: t('cf.save'), value: 'save', primary: true },
      ],
    })
    if (choice !== 'save' && choice !== 'discard') return 'cancelled'
    if (choice === 'save' && !(await saveFn())) return 'cancelled'
  }
  if (state.docs.length === 1) return 'quit'
  closedStack.push({ content: d.content, filePath: d.filePath, fileName: d.fileName, dirty: d.dirty, sel: d.sel || 0 })
  if (closedStack.length > 20) closedStack.shift()
  removeDoc(d.id)
  showDoc(activeDoc())
  toastDoc()
  return 'closed'
}

export function reopenTab() {
  const s = closedStack.pop()
  if (!s) return false
  const cur = activeDoc()
  if (cur) cur.sel = editor.cursorOffset()
  const d = addDoc()
  d.content = s.content
  d.filePath = s.filePath
  d.fileName = s.fileName
  d.sel = s.sel
  showDoc(d)
  setDirty(s.dirty)
  toastDoc()
  return true
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
