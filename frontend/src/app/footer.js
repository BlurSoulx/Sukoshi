import { getExt, tabInfo, onTabsChange } from './state.js'
import { t } from './i18n.js'

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
  document.addEventListener('sukoshi:lang', refresh)
  refresh()
  return { refresh }

  function paint() {
    const v = editor.getValue()
    const off = Math.min(editor.cursorOffset(), v.length)
    const [line, col] = editor.lineCol(off)
    const trimmed = v.trim()
    const words = trimmed ? trimmed.split(/\s+/).length : 0
    posEl.textContent = `Ln ${line}, Col ${col}`
    const [ss, se] = editor.selection()
    statsEl.textContent = se > ss
      ? `${se - ss} ${t('ft.sel')}`
      : `${words} ${t('ft.words')} · ${v.length} ${t('ft.chars')} · ${editor.lineCount()} ${t('ft.lines')}`
    typeEl.textContent =
      getExt() === '.txt' ? t('ft.plain') :
      getExt() === '.html' ? 'HTML' :
      getExt() === '.css' ? 'CSS' :
      getExt() === '.js' ? 'JavaScript' : t('ft.markdown')
    const { index, total } = tabInfo()
    tabsEl.hidden = total < 2
    tabsEl.textContent = `${index}/${total}`
  }
}
