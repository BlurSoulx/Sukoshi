const KEY = 'sukoshi-settings-v1'

const defaults = {
  bgAlpha: 100,
  fontSize: 14,
  theme: 'dark',
  font: 'system',
  zen: false,
  autosave: false,
}

let current = { ...defaults }

export function getSetting(k) {
  return current?.[k]
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

function apply(s) {
  current = s
  const r = document.documentElement
  r.style.setProperty('--bg-alpha', (s.bgAlpha / 100).toFixed(2))
  r.style.setProperty('--font-size', `${s.fontSize}px`)
  r.dataset.theme = s.theme === 'auto'
    ? (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
    : s.theme
  r.dataset.font = s.font
  document.body.classList.toggle('zen', !!s.zen)
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
  const alphaVal = document.getElementById('set-alpha-val')
  const fontSizeVal = document.getElementById('set-fontsize-val')

  alpha.value = s.bgAlpha
  fontSize.value = s.fontSize
  theme.value = s.theme
  font.value = s.font
  autosave.checked = !!s.autosave
  apply(s)
  paint()

  alpha.addEventListener('input', () => {
    s.bgAlpha = +alpha.value
    save(s); apply(s); paint()
  })
  fontSize.addEventListener('input', () => {
    s.fontSize = +fontSize.value
    save(s); apply(s); paint()
  })
  theme.addEventListener('change', () => {
    s.theme = theme.value
    save(s); apply(s)
  })
  font.addEventListener('change', () => {
    s.font = font.value
    save(s); apply(s)
  })
  autosave.addEventListener('change', () => {
    s.autosave = autosave.checked
    save(s); apply(s)
  })
  document.getElementById('set-reset')?.addEventListener('click', () => {
    Object.assign(s, defaults)
    alpha.value = s.bgAlpha
    fontSize.value = s.fontSize
    theme.value = s.theme
    font.value = s.font
    autosave.checked = !!s.autosave
    save(s); apply(s); paint()
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
