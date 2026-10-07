const KEY = 'sukoshi-settings-v1'

const defaults = {
  bgAlpha: 100,
  theme: 'dark',
  font: 'system',
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
  const r = document.documentElement
  r.style.setProperty('--bg-alpha', (s.bgAlpha / 100).toFixed(2))
  r.dataset.theme = s.theme
  r.dataset.font = s.font
}

export function initSettings() {
  const s = load()
  const root = document.getElementById('settings')
  const alpha = document.getElementById('set-alpha')
  const theme = document.getElementById('set-theme')
  const font = document.getElementById('set-font')
  const alphaVal = document.getElementById('set-alpha-val')

  alpha.value = s.bgAlpha
  theme.value = s.theme
  font.value = s.font
  apply(s)
  paint()

  alpha.addEventListener('input', () => {
    s.bgAlpha = +alpha.value
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
  document.getElementById('set-reset')?.addEventListener('click', () => {
    Object.assign(s, defaults)
    alpha.value = s.bgAlpha
    theme.value = s.theme
    font.value = s.font
    save(s); apply(s); paint()
  })
  document.getElementById('set-close')?.addEventListener('click', close)

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !root.hidden && document.getElementById('cmd')?.hidden !== false) {
      close()
    }
  })

  function paint() {
    alphaVal.textContent = `${s.bgAlpha}%`
    // Relleno de progreso del track (webkit no lo pinta solo).
    const pct = ((s.bgAlpha - 10) / 90) * 100
    alpha.style.setProperty('--p', `${pct}%`)
  }

  function open() {
    root.hidden = false
  }

  function close() {
    root.hidden = true
  }

  return { open, close, toggle: () => (root.hidden ? open() : close()), isOpen: () => !root.hidden }
}
