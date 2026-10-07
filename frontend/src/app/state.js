let nextId = 1

function freshName() {
  const taken = new Set(state.docs.map((d) => d.fileName))
  if (!taken.has('untitled.md')) return 'untitled.md'
  let n = 2
  while (taken.has(`untitled-${n}.md`)) n++
  return `untitled-${n}.md`
}

function makeDoc() {
  return { id: nextId++, content: '', filePath: '', fileName: '', dirty: false, sel: 0 }
}

export const state = {
  docs: [],
  activeId: 0,
}

{
  const d = makeDoc()
  d.fileName = 'untitled.md'
  state.docs.push(d)
  state.activeId = d.id
}

let tabsListener = null
export function onTabsChange(cb) {
  tabsListener = cb
}
function emit() {
  tabsListener?.()
}

export function activeDoc() {
  return state.docs.find((d) => d.id === state.activeId) ?? state.docs[0]
}

export function tabInfo() {
  const i = state.docs.findIndex((d) => d.id === state.activeId)
  return { index: i + 1, total: state.docs.length }
}

export function addDoc() {
  const d = makeDoc()
  d.fileName = freshName()
  state.docs.push(d)
  state.activeId = d.id
  emit()
  return d
}

export function removeDoc(id) {
  const i = state.docs.findIndex((d) => d.id === id)
  if (i < 0) return false
  state.docs.splice(i, 1)
  if (state.activeId === id) {
    const next = state.docs[Math.min(i, state.docs.length - 1)]
    state.activeId = next.id
  }
  emit()
  return true
}

export function setActive(id) {
  if (state.activeId === id) return
  state.activeId = id
  emit()
}

export function setFilePath(path) {
  const d = activeDoc()
  d.filePath = path || ''
  if (path) {
    const parts = path.split(/[/\\]/)
    d.fileName = parts[parts.length - 1] || 'untitled.md'
  } else if (!d.fileName) {
    d.fileName = freshName()
  }
  emit()
}

export function setDirty(value) {
  const d = activeDoc()
  d.dirty = value
  document.title = `${d.fileName}${value ? ' ●' : ''} — Sukoshi`
  const el = document.getElementById('st-file')
  if (el) el.textContent = `${d.fileName}${value ? ' ●' : ''}`
  emit()
}

export function getExt() {
  const name = activeDoc().fileName
  const i = name.lastIndexOf('.')
  return i >= 0 ? name.slice(i).toLowerCase() : ''
}
