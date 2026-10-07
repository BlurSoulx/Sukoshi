# Minimal Markdown/Text Editor — Wails + Vanilla Web

Quiero crear una aplicación de escritorio extremadamente ligera y rápida para escribir archivos `.txt` y `.md`.

La filosofía principal del proyecto es:

> **El editor es el producto. La interfaz prácticamente no existe.**

Debe sentirse como una herramienta instantánea, limpia y nativa, sin paneles innecesarios, barras de herramientas, menús permanentes ni elementos decorativos.

---

## 1. Stack obligatorio

### Frontend

Usar exclusivamente:

* HTML moderno
* CSS moderno
* JavaScript moderno / Vanilla JS
* ES Modules
* Vite
* PNPM

**NO usar npm.**

No utilizar:

* React
* Vue
* Svelte
* Angular
* Solid
* Tailwind
* Bootstrap
* jQuery
* UI frameworks
* componentes externos innecesarios

El frontend debe mantenerse extremadamente pequeño.

### Desktop wrapper

Utilizar **Wails**.

Wails debe encargarse de:

* crear la aplicación de escritorio
* crear la ventana nativa
* comunicación entre JavaScript y Go
* abrir/guardar archivos
* integración con el sistema operativo
* controlar características de la ventana

Importante:

**Wails no se instala mediante PNPM.**

El frontend se gestiona con:

```bash
pnpm install
```

pero Wails debe instalarse mediante su herramienta oficial de instalación para Go, siguiendo la documentación correspondiente a la versión actual.

Primero comprobar si están instalados:

```bash
go version
wails version
pnpm --version
```

Si falta Go o Wails, explicar brevemente qué falta y utilizar el método oficial de instalación correspondiente.

**Nunca instalar paquetes mediante npm.**

---

# 2. Filosofía de rendimiento

La aplicación debe ser deliberadamente minimalista.

Prioridades:

1. velocidad de arranque
2. bajo consumo de RAM
3. escritura sin lag
4. respuesta inmediata de teclado
5. interfaz mínima
6. código sencillo
7. pocas dependencias
8. facilidad de mantenimiento

No agregar funcionalidades "por si acaso".

Cada dependencia debe justificar su existencia.

Antes de instalar cualquier librería externa preguntarse:

> ¿Podemos hacerlo fácilmente con APIs nativas del navegador o con unas pocas líneas de JavaScript?

Si la respuesta es sí, no instalar la librería.

---

# 3. Interfaz

La ventana debe ser **frameless**.

No quiero:

* title bar tradicional
* botones de minimizar/maximizar/cerrar visibles
* barra de estado
* toolbar
* sidebar
* menú permanente
* breadcrumbs
* tabs
* panel de configuración visible
* contador de palabras
* contador de caracteres
* indicador de lenguaje
* indicador de línea/columna
* footer
* elementos decorativos innecesarios

La mayor parte de la ventana debe ser simplemente el editor.

Visualmente debe sentirse parecido a:

```text
┌──────────────────────────────────────────────┐
│  1  # My document                            │
│  2                                             │
│  3  This is some text...                      │
│  4  Another line of text                      │
│  5                                             │
│  6  ## Another section                        │
│                                              │
│                                              │
│                                              │
└──────────────────────────────────────────────┘
```

Nada más.

Los números de línea deben estar a la izquierda.

---

# 4. Editor

El editor debe soportar principalmente:

* texto plano
* Markdown

La escritura debe ser completamente libre.

Los formatos Markdown se escriben mediante teclado.

Ejemplos:

```text
# Heading

**bold**

*italic*

~~strikethrough~~

`inline code`

> quote

- list
- list
```

No crear botones para estas acciones.

No crear una toolbar Markdown.

No utilizar un editor WYSIWYG.

El usuario debe escribir Markdown directamente.

---

# 5. Números de línea

Cada línea debe mostrar su número a la izquierda.

Ejemplo:

```text
1   # Hello
2
3   Some text
4   **Bold**
5   Another line
```

Los números deben:

* actualizarse automáticamente
* permanecer perfectamente alineados con el texto
* hacer scroll sincronizado con el editor
* utilizar tipografía monoespaciada
* no interferir con la selección de texto
* no consumir una cantidad excesiva de espacio

El gutter de números debe ser visualmente muy discreto.

---

# 6. Arquitectura del editor

No utilizar Monaco Editor.

No utilizar CodeMirror salvo que exista una necesidad real que no pueda resolverse de forma sencilla.

Preferir una implementación propia utilizando APIs nativas del navegador.

Evaluar una arquitectura basada en:

```text
<textarea>
```

con un gutter separado para los números de línea.

La prioridad es que escribir 10.000+ líneas siga sintiéndose instantáneo.

Evitar:

* crear un DOM element por cada línea
* renderizar Markdown continuamente mientras se escribe
* hacer parsing completo del documento en cada pulsación
* listeners innecesarios
* operaciones síncronas costosas en cada `input`

Las actualizaciones del gutter deben estar optimizadas y, cuando corresponda, utilizar `requestAnimationFrame`.

---

# 7. Markdown

El editor NO necesita renderizar Markdown mientras se escribe.

El documento debe permanecer como texto Markdown.

Sin embargo, preparar la arquitectura para que posteriormente pueda existir una preview opcional.

Si se implementa preview en el futuro, podría utilizarse una librería pequeña como:

* marked
* markdown-it

pero **NO instalarla ahora si no es necesaria**.

---

# 8. Atajos de teclado

El teclado es parte fundamental de la aplicación.

Implementar como mínimo:

```text
Ctrl + N       Nuevo documento
Ctrl + O       Abrir archivo
Ctrl + S       Guardar
Ctrl + Shift + S   Guardar como
Ctrl + W       Cerrar documento / ventana
Ctrl + Z       Undo
Ctrl + Shift + Z / Ctrl + Y   Redo
Ctrl + F       Buscar
Ctrl + H       Reemplazar
```

Agregar también shortcuts útiles para Markdown cuando sean razonablemente simples.

Por ejemplo:

```text
Ctrl + B       insertar/toggle **bold**
Ctrl + I       insertar/toggle *italic*
Ctrl + Shift + X   ~~strikethrough~~
```

Pero estas acciones deben modificar el texto Markdown, no convertir el editor en WYSIWYG.

Ejemplo:

Si el usuario selecciona:

```text
hello
```

y pulsa:

```text
Ctrl + B
```

debe convertirse en:

```text
**hello**
```

Si vuelve a pulsarlo con el texto seleccionado:

```text
**hello**
```

debería poder quitar el formato.

---

# 9. Abrir y guardar archivos

Debe soportar:

```text
.txt
.md
.markdown
```

Utilizar las APIs nativas de Wails/Go para:

* abrir archivos
* guardar archivos
* guardar como
* detectar rutas
* interactuar con diálogos nativos

No intentar implementar acceso arbitrario al filesystem desde JavaScript.

La comunicación debe ser:

```text
JavaScript
    ↓
Wails binding
    ↓
Go
    ↓
Filesystem
```

---

# 10. Estado del documento

La aplicación debe conocer:

* contenido actual
* ruta del archivo
* si existen cambios sin guardar
* extensión
* nombre del documento

Si existen cambios sin guardar, mostrar una indicación mínima, por ejemplo:

```text
●
```

o un pequeño indicador junto al nombre del documento si finalmente existe un título mínimo.

No crear una barra de estado.

---

# 11. Auto-save

No implementar autosave agresivo por defecto.

Primero crear una arquitectura preparada para ello.

El comportamiento principal debe ser:

```text
Ctrl + S
```

para guardar.

Opcionalmente, guardar preferencias/configuración muy pequeñas en almacenamiento local si fuera necesario.

No guardar automáticamente el documento en múltiples lugares ni crear archivos temporales innecesarios.

---

# 12. Ventana

La ventana debe ser frameless.

Debe poder:

* moverse arrastrando una zona mínima de la interfaz
* redimensionarse
* minimizarse mediante shortcut
* maximizar/restaurar mediante shortcut
* cerrarse

No quiero una barra superior tradicional.

Si hace falta una pequeña zona draggable, debe ser prácticamente invisible y no quitar espacio útil al editor.

Utilizar las capacidades de Wails para controlar la ventana.

---

# 13. Diseño visual

Diseño extremadamente minimalista.

Inspiración general:

* editores de texto minimalistas
* terminales
* herramientas de escritura
* interfaces tipo Nothing
* aplicaciones nativas modernas

No copiar visualmente ninguna aplicación concreta.

Usar:

* tipografía monoespaciada
* fondo oscuro inicialmente
* texto claro
* gutter ligeramente menos visible
* selección nativa o una selección personalizada muy discreta
* spacing reducido
* sin bordes innecesarios

Por defecto:

```text
background: #111111
text:       #e5e5e5
gutter:     #555555
```

Pero mantener los colores en variables CSS para poder crear temas posteriormente.

---

# 14. Tipografía

Usar inicialmente una fuente monoespaciada del sistema.

No descargar fuentes externas.

Por ejemplo:

```css
font-family:
    ui-monospace,
    SFMono-Regular,
    Menlo,
    Monaco,
    Consolas,
    "Liberation Mono",
    monospace;
```

La prioridad es evitar cualquier request externo.

---

# 15. Responsive / DPI

Debe funcionar correctamente en:

* 100% DPI
* 125%
* 150%
* 200%

Evitar tamaños posicionados mediante hacks.

El editor debe utilizar unidades y medidas que mantengan alineados perfectamente:

```text
line number
      ↓
1   text
2   text
3   text
```

Incluso con zoom/DPI diferentes.

---

# 16. Estructura del proyecto

Mantener una estructura sencilla.

Una posible estructura:

```text
project/
├── app/
│   ├── app.js
│   ├── editor.js
│   ├── shortcuts.js
│   ├── files.js
│   └── state.js
│
├── styles/
│   ├── reset.css
│   ├── editor.css
│   └── theme.css
│
├── index.html
├── package.json
├── pnpm-lock.yaml
├── vite.config.js
│
├── main.go
├── app.go
├── wails.json
│
└── README.md
```

No dividir archivos arbitrariamente.

Cada archivo JavaScript/CSS debería mantenerse idealmente por debajo de unas **300 líneas**.

Si un archivo empieza a crecer demasiado, dividirlo siguiendo responsabilidades reales.

---

# 17. JavaScript

Utilizar JavaScript moderno:

* `const`
* `let`
* ES Modules
* async/await
* optional chaining
* destructuring
* clases solo cuando realmente aporten valor

Evitar:

* jQuery
* patrones excesivamente abstractos
* event buses innecesarios
* state management libraries
* arquitectura enterprise
* overengineering

El código debe ser fácil de leer.

No agregar comentarios explicando cosas obvias.

Comentar solamente decisiones técnicas no evidentes.

---

# 18. CSS

Utilizar CSS moderno.

Aprovechar:

* CSS nesting cuando sea apropiado
* custom properties
* `100dvh`
* `100dvw`
* `scrollbar-*`
* `caret-color`
* `accent-color`
* `:focus-visible`

Evitar frameworks CSS.

No crear clases para cada pequeño detalle.

El CSS debe ser extremadamente pequeño.

---

# 19. Dependencias

Antes de instalar una dependencia:

1. comprobar si existe una API nativa equivalente
2. comprobar el tamaño/impacto de la dependencia
3. determinar si realmente es necesaria

El resultado final debe tener muy pocas dependencias.

Frontend idealmente:

```text
Vite
```

y nada más, salvo dependencias estrictamente necesarias.

---

# 20. Wails

Antes de implementar la aplicación:

1. comprobar versión de Go
2. comprobar Wails
3. comprobar PNPM
4. crear/inicializar el proyecto Wails correctamente
5. configurar el frontend con Vite
6. comprobar que `wails dev` funciona
7. comprobar que `wails build` funciona

**No asumir comandos de instalación de Wails sin comprobar la versión instalada/documentación disponible.**

Wails debe ser la capa nativa.

No convertir el proyecto en una aplicación Go compleja.

Go debe encargarse principalmente de:

* filesystem
* ventana
* integración nativa
* bindings necesarios

La lógica del editor debe permanecer principalmente en JavaScript.

---

# 21. Restricciones importantes

Estas reglas son obligatorias:

* NO npm
* SOLO PNPM para paquetes JavaScript
* NO Electron
* NO Tauri
* NO React
* NO Vue
* NO frameworks frontend
* NO Tailwind
* NO Bootstrap
* NO Monaco
* NO backend/server
* NO conexión a Internet necesaria para funcionar
* NO analytics
* NO telemetría
* NO fuentes remotas
* NO CDN
* NO UI innecesaria

La aplicación debe funcionar completamente offline.

---

# 22. Calidad

Antes de considerar terminado el proyecto comprobar:

### Editor

* escribir texto
* crear líneas
* borrar líneas
* pegar grandes cantidades de texto
* seleccionar texto
* copiar/cortar/pegar
* undo/redo
* scroll
* números de línea sincronizados

### Markdown

* escribir Markdown normalmente
* Ctrl+B
* Ctrl+I
* strikethrough
* listas
* headings
* code
* quotes

### Archivos

* nuevo
* abrir `.txt`
* abrir `.md`
* guardar
* guardar como
* modificar archivo existente
* detectar cambios sin guardar

### Ventana

* abrir
* cerrar
* minimizar
* maximizar
* restaurar
* mover
* redimensionar

### Rendimiento

Probar documentos grandes:

```text
1.000 líneas
10.000 líneas
50.000 líneas
100.000 líneas
```

La escritura debe seguir siendo razonablemente fluida.

---

# 23. Desarrollo

Trabajar incrementalmente.

Primero conseguir:

```text
Wails
  ↓
Vite
  ↓
HTML/CSS/JS
  ↓
editor funcional
```

Después:

```text
line numbers
  ↓
keyboard shortcuts
  ↓
file open/save
  ↓
window controls
  ↓
polish
```

No implementar diez funcionalidades simultáneamente.

Después de cada etapa ejecutar la aplicación y comprobar que sigue funcionando.

---

# 24. Entregable final

Al terminar quiero tener:

1. proyecto completo funcionando
2. instrucciones de instalación
3. instrucciones de desarrollo
4. instrucciones de build
5. explicación breve de cómo funciona la arquitectura
6. lista de dependencias
7. comandos exactos para ejecutar:

```bash
pnpm install
pnpm dev
```

y el comando correspondiente para ejecutar Wails.

También incluir el comando de producción:

```bash
wails build
```

o el equivalente correcto para la versión utilizada.

El README debe explicar claramente qué herramientas deben instalarse previamente:

```text
Go
Wails CLI
Node.js
PNPM
```

Node.js solo debe utilizarse como runtime requerido por PNPM/Vite; **no utilizar npm bajo ninguna circunstancia**.

---

# Objetivo final

El resultado debe sentirse como:

> "Una caja de texto extremadamente rápida que casualmente es una aplicación de escritorio."

Cuando la aplicación está abierta, el usuario debe pensar principalmente en **escribir**, no en utilizar una interfaz.

Si una decisión de diseño o arquitectura añade complejidad pero no mejora directamente la experiencia de escritura, **no implementarla**.
