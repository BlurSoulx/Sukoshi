// Dropdown propio y temático (el <select> nativo no admite radius,
// flecha custom ni popup oscuro real). Botón + lista con teclado.
export function createDropdown(root, { value, options, onChange }) {
  root.classList.add('dd')
  root.innerHTML =
    '<button type="button" class="dd-btn"><span class="dd-label"></span>' +
    '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg></button>' +
    '<ul class="dd-list" hidden></ul>'
  const btn = root.querySelector('.dd-btn')
  const label = root.querySelector('.dd-label')
  const list = root.querySelector('.dd-list')
  let current = value
  let sel = 0

  for (const o of options) {
    const li = document.createElement('li')
    li.textContent = o.label
    li.dataset.value = o.value
    li.addEventListener('click', () => choose(o.value))
    li.addEventListener('mouseenter', () => {
      sel = [...list.children].indexOf(li)
      paint()
    })
    list.appendChild(li)
  }

  btn.addEventListener('click', (e) => {
    e.stopPropagation()
    if (list.hidden) open()
    else close()
  })
  btn.addEventListener('keydown', (e) => {
    if ((e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') && list.hidden) {
      e.preventDefault()
      open()
    }
  })
  document.addEventListener('click', (e) => {
    if (!list.hidden && !e.target.closest?.('.dd')) close()
  })
  document.addEventListener('keydown', (e) => {
    if (list.hidden) return
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopImmediatePropagation()
      close()
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      e.stopImmediatePropagation()
      const n = list.children.length
      sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + n) % n
      paint()
    } else if (e.key === 'Enter') {
      e.preventDefault()
      e.stopImmediatePropagation()
      choose(list.children[sel]?.dataset.value)
    }
  })

  set(value)
  return { get: () => current, set }

  function open() {
    sel = Math.max(0, [...list.children].findIndex((li) => li.dataset.value === current))
    paint()
    list.hidden = false
  }

  function close() {
    list.hidden = true
  }

  function paint() {
    [...list.children].forEach((li, i) => {
      li.classList.toggle('active', i === sel)
      li.classList.toggle('picked', li.dataset.value === current)
    })
    list.children[sel]?.scrollIntoView({ block: 'nearest' })
  }

  function set(v) {
    current = v
    const o = options.find((x) => x.value === v) ?? options[0]
    label.textContent = o ? o.label : v
  }

  function choose(v) {
    if (v == null) return
    close()
    if (v === current) return
    set(v)
    onChange?.(v)
  }
}
