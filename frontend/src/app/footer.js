import { getExt, tabInfo, onTabsChange } from './state.js'

export function initFooter(editor) {
  const posEl = document.getElementById('st-pos')
  const statsEl = document.getElementById('st-stats')
  const typeEl = document.getElementById('st-type')
  const tabsEl = document.getElementById('st-tabs')
  let raf = 0

  const refresh = () => {
    if (raf) return
    raf = requestAnimationFrame(() => {
      raf = 0
      paint()
    })
  }

  editor.onActivity(refresh)
  onTabsChange(refresh)
  refresh()
  return { refresh }

  function paint() {
    const v = editor.getValue()
    const off = Math.min(editor.cursorOffset(), v.length)
    let line = 1
    let lastNl = -1
    for (let i = 0; i < off; i++) {
      if (v[i] === '\n') { line++; lastNl = i }
    }
    const t = v.trim()
    const words = t ? t.split(/\s+/).length : 0
    posEl.textContent = `Ln ${line}, Col ${off - lastNl}`
    statsEl.textContent = `${words} palabras · ${v.length} caracteres · ${editor.lineCount()} líneas`
    typeEl.textContent = getExt() === '.txt' ? 'Texto plano' : 'Markdown'
    const { index, total } = tabInfo()
    tabsEl.hidden = total < 2
    tabsEl.textContent = `${index}/${total}`
  }
}
