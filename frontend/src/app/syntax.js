export const SYNTAX_HTML = `
<div class="md-cheatsheet">
  <h4>Encabezados</h4>
  <div class="row"><code># Título</code><span>h1 · ## h2 · ### h3 …</span></div>
  <h4>Énfasis</h4>
  <div class="row"><code>**negrita**</code><span>Ctrl+B</span></div>
  <div class="row"><code>*cursiva*</code><span>Ctrl+I</span></div>
  <div class="row"><code>~~tachado~~</code><span>Ctrl+Shift+X</span></div>
  <div class="row"><code>\`código\`</code><span>en línea</span></div>
  <h4>Bloques</h4>
  <div class="row"><code>\`\`\` bloque \`\`\`</code><span>código multilínea</span></div>
  <div class="row"><code>&gt; cita</code><span>cita</span></div>
  <div class="row"><code>---</code><span>línea horizontal</span></div>
  <h4>Listas</h4>
  <div class="row"><code>- item</code><span>viñeta (*, +)</span></div>
  <div class="row"><code>1. item</code><span>numerada</span></div>
  <div class="row"><code>- [ ] todo</code><span>checkbox</span></div>
  <h4>Enlaces e imágenes</h4>
  <div class="row"><code>[texto](url)</code><span>enlace</span></div>
  <div class="row"><code>![alt](url)</code><span>imagen</span></div>
  <h4>Tablas</h4>
  <div class="row"><code>| a | b |\n|---|---|\n| 1 | 2 |</code><span>tabla</span></div>
  <h4>Varios</h4>
  <div class="row"><code>\\*literal\\*</code><span>escapar con \\</span></div>
  <h4>Snippets (palabra + Tab)</h4>
  <div class="row"><code>fecha</code><span>2026-10-08</span></div>
  <div class="row"><code>hora</code><span>14:30</span></div>
  <div class="row"><code>tabla</code><span>plantilla de tabla</span></div>
  <div class="row"><code>lorem</code><span>texto de relleno</span></div>
  <h4>Emmet (playground, Tab)</h4>
  <div class="row"><code>.box / #id</code><span>div con clase/id</span></div>
  <div class="row"><code>ul&gt;li*3</code><span>hijos y repetir</span></div>
  <div class="row"><code>h1+p / div&gt;p^span</code><span>hermanos y subir</span></div>
  <div class="row"><code>li.item$*3</code><span>numerar ($$ rellena)</span></div>
  <div class="row"><code>a[href=url] / p{texto}</code><span>attrs y texto</span></div>
  <div class="row"><code>(div&gt;p)*2 / !</code><span>grupos y base HTML</span></div>
  <div class="row"><code>m10 / w100p / d:f</code><span>CSS en su pane</span></div>
</div>`

export const SYNTAX_HTML_EN = `
<div class="md-cheatsheet">
  <h4>Headings</h4>
  <div class="row"><code># Title</code><span>h1 · ## h2 · ### h3 …</span></div>
  <h4>Emphasis</h4>
  <div class="row"><code>**bold**</code><span>Ctrl+B</span></div>
  <div class="row"><code>*italic*</code><span>Ctrl+I</span></div>
  <div class="row"><code>~~strike~~</code><span>Ctrl+Shift+X</span></div>
  <div class="row"><code>\`code\`</code><span>inline</span></div>
  <h4>Blocks</h4>
  <div class="row"><code>\`\`\` block \`\`\`</code><span>multiline code</span></div>
  <div class="row"><code>&gt; quote</code><span>blockquote</span></div>
  <div class="row"><code>---</code><span>horizontal rule</span></div>
  <h4>Lists</h4>
  <div class="row"><code>- item</code><span>bullet (*, +)</span></div>
  <div class="row"><code>1. item</code><span>numbered</span></div>
  <div class="row"><code>- [ ] todo</code><span>checkbox</span></div>
  <h4>Links & images</h4>
  <div class="row"><code>[text](url)</code><span>link</span></div>
  <div class="row"><code>![alt](url)</code><span>image</span></div>
  <h4>Tables</h4>
  <div class="row"><code>| a | b |\n|---|---|\n| 1 | 2 |</code><span>table</span></div>
  <h4>Misc</h4>
  <div class="row"><code>\\*literal\\*</code><span>escape with \\</span></div>
  <h4>Snippets (word + Tab)</h4>
  <div class="row"><code>fecha</code><span>2026-10-08</span></div>
  <div class="row"><code>hora</code><span>14:30</span></div>
  <div class="row"><code>tabla</code><span>table template</span></div>
  <div class="row"><code>lorem</code><span>filler text</span></div>
  <h4>Emmet (playground, Tab)</h4>
  <div class="row"><code>.box / #id</code><span>div with class/id</span></div>
  <div class="row"><code>ul&gt;li*3</code><span>children & repeat</span></div>
  <div class="row"><code>h1+p / div&gt;p^span</code><span>siblings & climb</span></div>
  <div class="row"><code>li.item$*3</code><span>number ($$ pads)</span></div>
  <div class="row"><code>a[href=url] / p{text}</code><span>attrs & text</span></div>
  <div class="row"><code>(div&gt;p)*2 / !</code><span>groups & HTML base</span></div>
  <div class="row"><code>m10 / w100p / d:f</code><span>CSS in its pane</span></div>
</div>`

export const SHORTCUTS_HTML = `
<div class="md-cheatsheet">
  <h4>Archivo</h4>
  <div class="row"><code>Ctrl+N</code><span>nuevo documento</span></div>
  <div class="row"><code>Ctrl+O</code><span>abrir archivo</span></div>
  <div class="row"><code>Ctrl+S</code><span>guardar</span></div>
  <div class="row"><code>Ctrl+Shift+S</code><span>guardar como</span></div>
  <div class="row"><code>Ctrl+W</code><span>cerrar pestaña</span></div>
  <h4>Edición</h4>
  <div class="row"><code>Ctrl+Z / Ctrl+Shift+Z</code><span>deshacer / rehacer</span></div>
  <div class="row"><code>Ctrl+D</code><span>duplicar líneas</span></div>
  <div class="row"><code>Ctrl+J</code><span>unir líneas</span></div>
  <div class="row"><code>Alt+↑ / Alt+↓</code><span>mover líneas</span></div>
  <div class="row"><code>Ctrl+. o Ctrl+/</code><span>comentar línea</span></div>
  <div class="row"><code>Alt+Z</code><span>ajuste de línea</span></div>
  <div class="row"><code>Tab (con palabra)</code><span>snippet / Emmet</span></div>
  <h4>Buscar</h4>
  <div class="row"><code>Ctrl+F / Ctrl+H</code><span>buscar / reemplazar</span></div>
  <div class="row"><code>Ctrl+Shift+F</code><span>buscar en pestañas</span></div>
  <div class="row"><code>Ctrl+G</code><span>ir a la línea</span></div>
  <div class="row"><code>Ctrl+K</code><span>paleta de comandos</span></div>
  <h4>Pestañas y vista</h4>
  <div class="row"><code>Ctrl+Tab / Ctrl+1·2·3</code><span>cambiar pestaña / pane</span></div>
  <div class="row"><code>Ctrl+Shift+Tab</code><span>grid de pestañas</span></div>
  <div class="row"><code>Ctrl+Shift+T</code><span>reabrir pestaña</span></div>
  <div class="row"><code>Ctrl+Shift+V</code><span>preview Markdown</span></div>
  <div class="row"><code>Ctrl+\`</code><span>playground web</span></div>
  <div class="row"><code>F11</code><span>modo zen</span></div>
  <div class="row"><code>F1</code><span>esta chuleta</span></div>
  <div class="row"><code>Ctrl+,</code><span>configuración</span></div>
  <h4>Playground</h4>
  <div class="row"><code>Ctrl+S</code><span>guardar pane enfocado</span></div>
  <div class="row"><code>Ctrl+Plus / Minus / 0</code><span>zoom del preview</span></div>
</div>`

export const SHORTCUTS_HTML_EN = `
<div class="md-cheatsheet">
  <h4>File</h4>
  <div class="row"><code>Ctrl+N</code><span>new document</span></div>
  <div class="row"><code>Ctrl+O</code><span>open file</span></div>
  <div class="row"><code>Ctrl+S</code><span>save</span></div>
  <div class="row"><code>Ctrl+Shift+S</code><span>save as</span></div>
  <div class="row"><code>Ctrl+W</code><span>close tab</span></div>
  <h4>Edit</h4>
  <div class="row"><code>Ctrl+Z / Ctrl+Shift+Z</code><span>undo / redo</span></div>
  <div class="row"><code>Ctrl+D</code><span>duplicate lines</span></div>
  <div class="row"><code>Ctrl+J</code><span>join lines</span></div>
  <div class="row"><code>Alt+↑ / Alt+↓</code><span>move lines</span></div>
  <div class="row"><code>Ctrl+. or Ctrl+/</code><span>toggle line comment</span></div>
  <div class="row"><code>Alt+Z</code><span>word wrap</span></div>
  <div class="row"><code>Tab (after a word)</code><span>snippet / Emmet</span></div>
  <h4>Find</h4>
  <div class="row"><code>Ctrl+F / Ctrl+H</code><span>find / replace</span></div>
  <div class="row"><code>Ctrl+Shift+F</code><span>find in tabs</span></div>
  <div class="row"><code>Ctrl+G</code><span>go to line</span></div>
  <div class="row"><code>Ctrl+K</code><span>command palette</span></div>
  <h4>Tabs & view</h4>
  <div class="row"><code>Ctrl+Tab / Ctrl+1·2·3</code><span>switch tab / pane</span></div>
  <div class="row"><code>Ctrl+Shift+Tab</code><span>tab grid</span></div>
  <div class="row"><code>Ctrl+Shift+T</code><span>reopen tab</span></div>
  <div class="row"><code>Ctrl+Shift+V</code><span>Markdown preview</span></div>
  <div class="row"><code>Ctrl+\`</code><span>web playground</span></div>
  <div class="row"><code>F11</code><span>zen mode</span></div>
  <div class="row"><code>F1</code><span>this cheatsheet</span></div>
  <div class="row"><code>Ctrl+,</code><span>settings</span></div>
  <h4>Playground</h4>
  <div class="row"><code>Ctrl+S</code><span>save focused pane</span></div>
  <div class="row"><code>Ctrl+Plus / Minus / 0</code><span>preview zoom</span></div>
</div>`
