import { THEMES, themeById } from './themes.js'
import { createDropdown } from './dropdown.js'
import { t, langSetting, setLang } from './i18n.js'

const KEY = 'sukoshi-settings-v1'

const defaults = {
  bgAlpha: 100,
  fontSize: 14,
  theme: 'dark',
  font: 'system',
  zen: false,
  autosave: false,
  themedPreview: true,
  accent: 'auto',
  curline: true,
}

let current = { ...defaults }

export function getSetting(k) {
  return current?.[k]
}

export function currentTheme() {
  return resolveTheme(current.theme)
}

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...defaults }
    return { ...defaults, ...JSON.parse(raw) }
  } catch {
    return { ...defaults }
  }
}

function save(s) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    /* almacenamiento no disponible: la sesión sigue funcionando */
  }
}

function hexToRgb(hex) {
  const h = hex.replace('#', '')
  const v = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = parseInt(v, 16)
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`
}

function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).split(' ').map((x) => {
    const c = +x / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function resolveTheme(id) {
  if (id === 'auto') {
    return matchMedia('(prefers-color-scheme: light)').matches ? themeById('light') : themeById('dark')
  }
  return themeById(id)
}

let lastThemeId = null

function apply(s) {
  current = s
  const r = document.documentElement
  r.style.setProperty('--bg-alpha', (s.bgAlpha / 100).toFixed(2))
  r.style.setProperty('--font-size', `${s.fontSize}px`)
  const t = resolveTheme(s.theme)
  r.style.setProperty('--bg', t.ui.bg)
  r.style.setProperty('--bg-rgb', hexToRgb(t.ui.bg))
  r.style.setProperty('--fg', t.ui.fg)
  r.style.setProperty('--gutter', t.ui.gutter)
  r.style.setProperty('--caret', t.ui.fg)
  r.style.setProperty('--selection', t.ui.selection)
  r.style.setProperty('--scrollbar', t.ui.scrollbar)
  r.style.setProperty('--scrollbar-hover', t.ui.scrollbarHover)
  r.style.setProperty('--search-bg', t.ui.searchBg)
  const acc = s.accent && s.accent !== 'auto' ? s.accent : t.ui.accent
  r.style.setProperty('--accent', acc)
  r.style.setProperty('--on-accent', luminance(acc) > 0.35 ? '#141414' : '#ffffff')
  r.style.setProperty('--overlay', t.mode === 'light' ? 'rgb(255 255 255 / 0.6)' : 'rgb(0 0 0 / 0.55)')
  for (const [k, v] of Object.entries(t.code)) {
    r.style.setProperty(`--c-${k}`, v)
  }
  r.dataset.theme = t.mode === 'light' ? 'light' : 'dark'
  r.dataset.font = s.font
  document.body.classList.toggle('zen', !!s.zen)
  if (t.id !== lastThemeId) {
    lastThemeId = t.id
    document.dispatchEvent(new CustomEvent('sukoshi:theme'))
  }
}

try {
  matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
    if (current.theme === 'auto') apply(current)
  })
} catch { /* SO sin tema dinámico */ }

export function initSettings() {
  const s = load()
  const root = document.getElementById('settings')
  const alpha = document.getElementById('set-alpha')
  const fontSize = document.getElementById('set-fontsize')
  const theme = document.getElementById('set-theme')
  const font = document.getElementById('set-font')
  const autosave = document.getElementById('set-autosave')
  const themedPreview = document.getElementById('set-themed-preview')
  const accentPick = document.getElementById('set-accent')
  const curline = document.getElementById('set-curline')
  const alphaVal = document.getElementById('set-alpha-val')
  const fontSizeVal = document.getElementById('set-fontsize-val')
  const effAccent = () => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#d29922'
  const syncAccentPick = () => { if (accentPick) accentPick.value = /^#[0-9a-f]{6}$/i.test(effAccent()) ? effAccent() : '#d29922' }

  alpha.value = s.bgAlpha
  fontSize.value = s.fontSize
  if (!themeById(s.theme) && s.theme !== 'auto') s.theme = 'dark'
  if (!['system', 'consolas', 'cascadia'].includes(s.font)) s.font = 'system'
  // Los dropdowns se reconstruyen al cambiar el idioma (etiquetas).
  let themeDD = null
  let fontDD = null
  let langDD = null
  const buildDropdowns = () => {
    theme.innerHTML = ''
    font.innerHTML = ''
    const langEl = document.getElementById('set-lang')
    if (langEl) langEl.innerHTML = ''
    themeDD = createDropdown(theme, {
      value: s.theme,
      options: [{ value: 'auto', label: t('set.themeAuto') }, ...THEMES.map((x) => ({ value: x.id, label: x.name }))],
      onChange: (v) => {
        s.theme = v
        save(s); apply(s); syncAccentPick()
      },
    })
    fontDD = createDropdown(font, {
      value: s.font,
      options: [
        { value: 'system', label: t('set.fontSystem') },
        { value: 'consolas', label: 'Consolas' },
        { value: 'cascadia', label: 'Cascadia Mono' },
      ],
      onChange: (v) => {
        s.font = v
        save(s); apply(s)
      },
    })
    if (langEl) {
      langDD = createDropdown(langEl, {
        value: langSetting(),
        options: [
          { value: 'auto', label: 'Auto' },
          { value: 'es', label: 'Español' },
          { value: 'en', label: 'English' },
        ],
        onChange: (v) => setLang(v),
      })
    }
  }
  buildDropdowns()
  document.addEventListener('sukoshi:lang', buildDropdowns)
  autosave.checked = !!s.autosave
  if (themedPreview) themedPreview.checked = s.themedPreview !== false
  if (curline) curline.checked = s.curline !== false
  apply(s)
  syncAccentPick()
  paint()

  alpha.addEventListener('input', () => {
    s.bgAlpha = +alpha.value
    save(s); apply(s); paint()
  })
  fontSize.addEventListener('input', () => {
    s.fontSize = +fontSize.value
    save(s); apply(s); paint()
  })
  autosave.addEventListener('change', () => {
    s.autosave = autosave.checked
    save(s); apply(s)
  })
  accentPick?.addEventListener('input', () => {
    s.accent = accentPick.value
    save(s); apply(s)
  })
  document.getElementById('set-accent-auto')?.addEventListener('click', () => {
    s.accent = 'auto'
    save(s); apply(s); syncAccentPick()
  })
  curline?.addEventListener('change', () => {
    s.curline = curline.checked
    save(s); apply(s)
    document.dispatchEvent(new CustomEvent('sukoshi:curline'))
  })
  themedPreview?.addEventListener('change', () => {
    s.themedPreview = themedPreview.checked
    save(s); apply(s)
    document.dispatchEvent(new CustomEvent('sukoshi:theme'))
  })
  document.getElementById('set-reset')?.addEventListener('click', () => {
    Object.assign(s, defaults)
    alpha.value = s.bgAlpha
    fontSize.value = s.fontSize
    themeDD.set(s.theme)
    fontDD.set(s.font)
    autosave.checked = !!s.autosave
    if (themedPreview) themedPreview.checked = s.themedPreview !== false
    if (curline) curline.checked = s.curline !== false
    save(s); apply(s); syncAccentPick(); paint()
    document.dispatchEvent(new CustomEvent('sukoshi:curline'))
  })
  document.getElementById('set-close')?.addEventListener('click', close)

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !root.hidden && document.getElementById('cmd')?.hidden !== false) {
      close()
    }
  })

  function fill(el, min, max) {
    el.style.setProperty('--p', `${((+el.value - min) / (max - min)) * 100}%`)
  }

  function paint() {
    alphaVal.textContent = `${s.bgAlpha}%`
    fontSizeVal.textContent = `${s.fontSize}px`
    fill(alpha, 10, 100)
    fill(fontSize, 10, 24)
  }

  function open() {
    // Borde derecho alineado con el del botón de config (como el menú ···).
    const btn = document.getElementById('tb-settings')
    if (btn) root.style.right = `${Math.max(0, window.innerWidth - btn.getBoundingClientRect().right)}px`
    root.hidden = false
  }

  function close() {
    root.hidden = true
  }

  function changeFontSize(d) {
    s.fontSize = Math.min(24, Math.max(10, s.fontSize + d))
    fontSize.value = s.fontSize
    save(s); apply(s); paint()
  }

  function toggleZen() {
    s.zen = !s.zen
    save(s); apply(s)
    return s.zen
  }

  return { open, close, toggle: () => (root.hidden ? open() : close()), isOpen: () => !root.hidden, changeFontSize, toggleZen }
}
