import { activeDoc, setDirty } from './state.js'

export function createEditor(textarea, gutter) {
  let raf = 0
  let lineCount = 1
  let activityCb = null
  const fireActivity = () => activityCb?.()

  const scheduleGutter = () => {
    if (raf) return
    raf = requestAnimationFrame(() => {
      raf = 0
      renderGutter()
      syncScroll()
    })
  }

  const countLines = () => {
    const v = textarea.value
    let n = 1
    for (let i = 0; i < v.length; i++) if (v[i] === '\n') n++
    return n
  }

  // Solo reconstruye el gutter si cambia el nº de líneas.
  // Evita crear un nodo por línea en cada input cuando el doc es grande.
  const renderGutter = () => {
    const n = countLines()
    // Ancho reservado en CSS hasta 4 dígitos: solo crece a partir de 10k líneas.
    const digits = String(n).length
    gutter.style.width = digits > 4 ? `calc(${digits}ch + 24px)` : ''
    if (n === lineCount && gutter.childNodes.length === n) return
    lineCount = n
    // textContent con saltos es 1 solo nodo: barato hasta 100k líneas.
    let s = ''
    for (let i = 1; i <= n; i++) s += i + '\n'
    gutter.textContent = s
  }

  const syncScroll = () => {
    gutter.scrollTop = textarea.scrollTop
  }

  textarea.addEventListener('input', () => {
    activeDoc().content = textarea.value
    setDirty(true)
    scheduleGutter()
    fireActivity()
  })
  // Cursor/selección también mueven el footer (Ln/Col), no solo el contenido.
  for (const ev of ['click', 'keyup', 'select']) {
    textarea.addEventListener(ev, fireActivity)
  }
  textarea.addEventListener('scroll', () => {
    if (raf) return
    raf = requestAnimationFrame(() => {
      raf = 0
      syncScroll()
    })
  }, { passive: true })

  // Tab inserta 2 espacios para no perder el foco ni romper markdown.
  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Tab' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault()
      const { selectionStart: s, selectionEnd: en, value } = textarea
      textarea.setRangeText('  ', s, en, 'end')
      textarea.dispatchEvent(new Event('input', { bubbles: true }))
    }
  })

  return {
    el: textarea,
    getValue: () => textarea.value,
    setValue: (v) => {
      textarea.value = v ?? ''
      activeDoc().content = textarea.value
      renderGutter()
      syncScroll()
      textarea.scrollTop = 0
      fireActivity()
    },
    focus: () => textarea.focus(),
    onActivity: (cb) => { activityCb = cb },
    lineCount: () => lineCount,
    cursorOffset: () => textarea.selectionStart,
    toggleWrap,
  }

  function toggleWrap(prefix, suffix = prefix) {
    const { selectionStart: s, selectionEnd: e, value } = textarea
    const sel = value.slice(s, e)
    const before = value.slice(Math.max(0, s - prefix.length), s)
    const after = value.slice(e, e + suffix.length)
    let next, ns, ne
    if (before === prefix && after === suffix && sel.length >= 0) {
      // Quita formato: **hello** -> hello
      textarea.setRangeText(sel, s - prefix.length, e + suffix.length, 'select')
      next = textarea.value
      ns = s - prefix.length
      ne = ns + sel.length
    } else if (sel.length > 0) {
      textarea.setRangeText(prefix + sel + suffix, s, e, 'select')
      next = textarea.value
      ns = s + prefix.length
      ne = ns + sel.length
    } else {
      textarea.setRangeText(prefix + suffix, s, e, 'select')
      next = textarea.value
      ns = ne = s + prefix.length
    }
    textarea.focus()
    textarea.setSelectionRange(ns, ne)
    textarea.dispatchEvent(new Event('input', { bubbles: true }))
    return next
  }
}
