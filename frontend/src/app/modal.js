// Confirmación propia con el estilo de la app (reemplaza confirm()).
// Resuelve con el value del botón o null (Esc / clic fuera).
// Tab/Shift+Tab ciclan dentro del modal (trampa de foco).
function trapTab(e) {
  if (e.key !== 'Tab') return false
  const box = document.getElementById('modal-box')
  const els = [...box.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')]
    .filter((el) => !el.hidden && !el.disabled && el.offsetParent !== null)
  if (!els.length) {
    e.preventDefault()
    return true
  }
  const first = els[0]
  const last = els[els.length - 1]
  const cur = document.activeElement
  if (e.shiftKey && (cur === first || !box.contains(cur))) {
    e.preventDefault()
    last.focus()
    return true
  }
  if (!e.shiftKey && (cur === last || !box.contains(cur))) {
    e.preventDefault()
    first.focus()
    return true
  }
  return false
}

export function confirmModal({ title, message, buttons }) {
  return new Promise((resolve) => {
    const prevFocus = document.activeElement
    const root = document.getElementById('modal')
    document.getElementById('modal-title').textContent = title
    document.getElementById('modal-msg').textContent = message
    document.getElementById('modal-x').hidden = true
    const wrap = document.getElementById('modal-btns')
    wrap.hidden = false
    wrap.innerHTML = ''

    const done = (v) => {
      root.hidden = true
      document.removeEventListener('keydown', onKey, true)
      root.removeEventListener('click', out)
      if (prevFocus?.focus) prevFocus.focus()
      resolve(v)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        done(null)
      } else if (trapTab(e)) {
        e.stopPropagation()
      }
    }
    const out = (e) => {
      if (e.target === root) done(null)
    }

    for (const b of buttons) {
      const btn = document.createElement('button')
      btn.textContent = b.label
      if (b.primary) btn.className = 'primary'
      btn.addEventListener('click', () => done(b.value))
      wrap.appendChild(btn)
    }
    root.addEventListener('click', out)

    document.addEventListener('keydown', onKey, true)
    root.hidden = false
    wrap.querySelector('button.primary')?.focus()
  })
}

export function isModalOpen() {
  return document.getElementById('modal')?.hidden === false
}

// Panel de lectura (ej. chuleta): HTML propio, un botón Cerrar.
export function showInfo({ title, body, wide = false }) {
  return new Promise((resolve) => {
    const prevFocus = document.activeElement
    const root = document.getElementById('modal')
    const box = document.getElementById('modal-box')
    document.getElementById('modal-title').textContent = title
    const x = document.getElementById('modal-x')
    x.hidden = false
    const msg = document.getElementById('modal-msg')
    msg.innerHTML = ''
    const doc = document.createElement('div')
    doc.id = 'modal-doc'
    doc.innerHTML = body
    msg.appendChild(doc)
    const wrap = document.getElementById('modal-btns')
    wrap.innerHTML = ''
    wrap.hidden = true

    box.classList.toggle('wide', wide)
    const done = (v) => {
      root.hidden = true
      box.classList.remove('wide')
      document.removeEventListener('keydown', onKey, true)
      root.removeEventListener('click', out)
      if (prevFocus?.focus) prevFocus.focus()
      resolve(v)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        done(null)
      } else if (trapTab(e)) {
        e.stopPropagation()
      }
    }
    const out = (e) => {
      if (e.target === root) done(null)
    }

    const btn = document.getElementById('modal-x')
    btn.onclick = () => done(true)
    root.addEventListener('click', out)

    document.addEventListener('keydown', onKey, true)
    root.hidden = false
    // Foco a la caja (sin anillo visible): Esc y clic siguen funcionando.
    document.getElementById('modal-box').focus()
  })
}
