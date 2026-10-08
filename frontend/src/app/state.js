let nextId = 1

function freshName() {
  const taken = new Set(state.docs.map((d) => d.fileName))
  if (!taken.has('untitled.txt')) return 'untitled.txt'
  let n = 2
  while (taken.has(`untitled-${n}.txt`)) n++
  return `untitled-${n}.txt`
}

function makeDoc() {
  return { id: nextId++, content: '', filePath: '', fileName: '', dirty: false, sel: 0 }
}

export const state = {
  docs: [],
  activeId: 0,
  mru: [],
}

function touchMru(id) {
  state.mru = [id, ...state.mru.filter((x) => x !== id)]
}

export function mruNextId() {
  const order = state.mru.filter((id) => state.docs.some((d) => d.id === id))
  const withoutActive = order.filter((id) => id !== state.activeId)
  return withoutActive[0] ?? order[0] ?? state.activeId
}

{
  const d = makeDoc()
  d.fileName = 'untitled.txt'
  state.docs.push(d)
  state.activeId = d.id
  touchMru(d.id)
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
  touchMru(d.id)
  emit()
  return d
}

export function removeDoc(id) {
  const i = state.docs.findIndex((d) => d.id === id)
  if (i < 0) return false
  state.docs.splice(i, 1)
  state.mru = state.mru.filter((x) => x !== id)
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
  touchMru(id)
  emit()
}

export function replaceDocs(list, activeIdx = 0) {
  state.docs = []
  for (const f of list) {
    const d = makeDoc()
    d.content = f.content || ''
    d.filePath = f.filePath || ''
    d.fileName = f.fileName || 'untitled.txt'
    d.dirty = !!f.dirty
    d.sel = f.sel || 0
    state.docs.push(d)
  }
  state.activeId = state.docs[Math.min(activeIdx, state.docs.length - 1)].id
  state.mru = [state.activeId, ...state.docs.map((d) => d.id).filter((id) => id !== state.activeId)]
  emit()
}

export function setFilePath(path) {
  const d = activeDoc()
  d.filePath = path || ''
  if (path) {
    const parts = path.split(/[/\\]/)
    d.fileName = parts[parts.length - 1] || 'untitled.txt'
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
