<p align="center">
  <img src="sukoshi.png" width="128" alt="Sukoshi" />
</p>

<h1 align="center">Sukoshi</h1>

<p align="center">
  Editor minimalista de Markdown y texto plano, con playground web integrado.<br />
  Rápido, offline y sin ruido: el editor es el producto, la interfaz casi no existe.
</p>

<p align="center">
  <strong><a href="https://github.com/BlurSoulx/Sukoshi/releases/tag/v0.1.0">Descargar v0.1.0 para Windows (portable, sin instalador)</a></strong>
</p>

---

## Qué es

Sukoshi es una app de escritorio (Wails + Go, frontend en Vanilla JS sin frameworks) para escribir `.txt` y `.md` al instante, y un modo playground para prototipar HTML/CSS/JS con preview en vivo sin salir de la app.

- **Sin Electron**: binario de ~12 MB que usa el WebView2 del sistema (~140 MB en RAM en reposo, 0% CPU).
- **Sin dependencias pesadas**: 3 librerías JS (`marked`, `DOMPurify`, `@speed-highlight/core`), sin CDN, sin telemetría. Funciona offline.
- **En español e inglés**, con 9 temas que cambian al instante.

## Descarga y uso

1. Descarga `Sukoshi-0.1.0-windows-x64.zip` desde [Releases](https://github.com/BlurSoulx/Sukoshi/releases/tag/v0.1.0).
2. Descomprime y ejecuta `Sukoshi.exe`. Sin instalación.
3. Requiere WebView2 (preinstalado en Windows 11 y en la mayoría de Windows 10).

> El ejecutable no está firmado: SmartScreen mostrará un aviso (`Más información → Ejecutar de todas formas`).

## Características

**Editor**
- Pestañas invisibles con grid estilo Alt+Tab (`Ctrl+Shift+Tab`), orden MRU y reabrir cerrada.
- Sesión restaurada al abrir, recarga ante cambios externos, autoguardado opcional.
- Buscar con marcas en el texto, anterior/siguiente y toggle de mayúsculas (`Ctrl+F`).
- Markdown con preview en vivo y exportación a HTML; resaltado HTML/CSS/JS solo del viewport.
- Mini-Emmet propio (0 dependencias), snippets, formateo de tablas, comentarios por lenguaje, deshacer/rehacer propio.

**Playground web** (`Ctrl+\``)
- Tres panes (HTML/CSS/JS) + preview sandboxed en vivo, 4 disposiciones, zoom, viewports, pausa.
- Consola con REPL, validador por pane con salto a línea, plantillas, export a `.zip` y `.html` único.

**Apariencia**
- 9 temas (Sukoshi Oscuro/Claro, Dracula, Nord, Tokyo Night, Catppuccin Mocha, Gruvbox, Monokai, SynthWave '84), acento personalizable, modo zen (`F11`), opacidad y fuente configurables.

## Atajos principales

| Atajo | Acción |
|---|---|
| `Ctrl+K` | Paleta de comandos |
| `Ctrl+F` / `Ctrl+H` / `Ctrl+G` | Buscar / reemplazar / ir a línea |
| `Ctrl+Tab` / `Ctrl+Shift+Tab` | Cambiar pestaña / grid |
| `Ctrl+\`` | Playground web |
| `Ctrl+Shift+V` | Preview Markdown |
| `F1` | Chuleta de atajos |
| `F11` | Modo zen |
| `Ctrl+,` | Configuración |

## Compilar desde fuente

| Herramienta | Verificación |
|---|---|
| Go 1.21+ | `go version` (`winget install Go.Go`) |
| Wails CLI | `go install github.com/wailsapp/wails/v2/cmd/wails@latest` |
| PNPM | https://pnpm.io/installation (**nunca npm**) |

```bash
# App completa
wails build        # → build/bin/Sukoshi.exe
wails dev          # desarrollo con recarga

# Solo frontend en el navegador
cd frontend && pnpm install && pnpm dev   # http://localhost:34115/
```

> Entorno verificado: Go 1.27.1, Wails v2.16.0, `wails doctor` OK.

## Arquitectura

```text
JavaScript (frontend/src)
  ↓  window.go.main.App.* (binding generado por Wails)
Go (app.go: solo filesystem + diálogos, sin lógica de editor)
  ↓  os.ReadFile / os.WriteFile / runtime dialogs
Filesystem + diálogos nativos
```

- `main.go`: ventana nativa (`Frameless: true`, translúcida), sirve `frontend/dist` embebido.
- `frontend/src/app/`: `editor` (textarea + overlay, 1 nodo de gutter), `state` (multi-doc), `tabs`/`session`/`watch`, `shortcuts`+`palette`, `play`+`play-console`, `preview`, `settings` (temas+i18n), `i18n`, `dropdown`, `modal`, `syntax`, `footer`, `files`, `icons`, mini-Emmet y gramática CSS propias.
- `frontend/src/styles/`: `reset`, `theme` (variables + `--menu-bg` común), `editor`, `settings`, `play`. Sin frameworks.

## Estructura

```text
Sukoshi/
├── main.go / app.go / go.mod / wails.json
├── sukoshi.png / build/windows/icon.ico (icono)
└── frontend/
    ├── index.html / package.json / vite.config.js
    └── src/{main.js, app/*.js, styles/*.css}
```

## Historial de cambios

Ver [CHANGELOG.md](CHANGELOG.md). La especificación original del proyecto vive en [Sukoshi.md](Sukoshi.md).
