# Sukoshi — Minimal Markdown/Text Editor (Wails + Vanilla)

> Una caja de texto extremadamente rápida que casualmente es una aplicación de escritorio.

Filosofía: **el editor es el producto. La interfaz prácticamente no existe.**

## Estado actual (etapa 1)

- [x] Frontend Vite + Vanilla JS funcional (`pnpm dev` / `pnpm build` verificados)
- [x] Editor `<textarea>` + gutter de números sincronizado con `requestAnimationFrame`
- [x] Barra de comandos (`Ctrl+K` / `Ctrl+Shift+P`): nuevo, abrir, guardar, buscar, reemplazar, ir a línea, formato
- [x] Buscar (`Ctrl+F`), reemplazar (`Ctrl+H`), ir a línea (`Ctrl+G`) desde la barra — sin paneles flotantes
- [x] Footer mínimo: archivo (+●), Ln/Col, palabras, caracteres, líneas, tipo (Markdown/Texto plano)
- [x] Pestañas sin UI visible: `Ctrl+T` nueva, `Ctrl+W` cierra (sale si es la última), `Ctrl+Tab` cicla, `Ctrl+Shift+Tab` grid estilo Alt+Tab (click/flechas/Enter), `Ctrl+K → Pestañas…` salta por nombre; footer muestra `i/n` en acento junto al archivo y toast transitorio al cambiar; cursor y dirty por pestaña
- [x] Scrollbars temáticas (WebKit + `scrollbar-color`) y gutter con ancho reservado hasta 9999 líneas
- [x] Configuración (engranaje / `Ctrl+,` / paleta): opacidad del fondo, tema oscuro/claro, fuente del sistema; persiste en localStorage (blur de fondo fijo del SO)
- [x] Apertura/guardado vía Wails Go + fallback navegador (para `pnpm dev` sin Wails)
- [x] Ventana frameless preparada (`#drag` con `--wails-draggable: drag`)
- [x] Verificado `wails build` → `build/bin/Sukoshi.exe` (Wails v2.16.0, Go 1.27.1)
- [ ] Probar `wails dev` y uso real del editor

## Requisitos previos

| Herramienta | Verificación | Instalación oficial |
|---|---|---|
| Go 1.21+ | `go version` | Descargar desde https://go.dev/dl/ y seguir https://go.dev/doc/install. En Windows también vale `winget install Go.Go`. Asegúrate de que `~/go/bin` esté en el `PATH`. |
| Wails CLI | `wails version` | `go install github.com/wailsapp/wails/v2/cmd/wails@latest` (documentación: https://wails.io/docs/gettingstarted/installation). Luego `wails doctor` (en Windows requiere runtime WebView2). |
| Node.js 15+ | `node --version` | Solo como runtime de PNPM/Vite. |
| PNPM | `pnpm --version` | https://pnpm.io/installation |

> Entorno verificado: Go 1.27.1, Wails v2.16.0, `wails doctor` OK (WebView2 instalado).

**Nunca usar npm.** Solo PNPM para paquetes JS. Wails se instala vía `go install`, no vía PNPM.

## Instalación

```bash
# 1. Frontend
cd frontend
pnpm install

# 2. Backend Go (cuando Go esté instalado)
cd ..
go mod tidy
```

## Desarrollo

```bash
# Solo frontend en navegador (con fallback de archivos nativo del navegador)
cd frontend
pnpm dev
# abre http://localhost:34115/

# App de escritorio completa (requiere Go + Wails)
wails dev
```

## Producción

```bash
cd frontend
pnpm build

# Binario nativo (requiere Go + Wails)
wails build
```

## Arquitectura

```text
JavaScript (frontend/src)
  ↓  window.go.main.App.* (binding generado por Wails; `main` = paquete Go)
Go (app.go)
  ↓  os.ReadFile / os.WriteFile / runtime dialogs
Filesystem + diálogos nativos
```

- `main.go`: ventana nativa Wails (`Frameless: true`, 900×650), sirve `frontend/dist` embebido.
- `app.go`: solo filesystem + diálogos (`OpenAndRead`, `WriteFile`, `SaveAs`). Sin lógica de editor.
- `frontend/src/app/state.js`: contenido, ruta, nombre, dirty. Sin librerías de estado.
- `frontend/src/app/editor.js`: `<textarea>` + gutter de 1 solo nodo de texto, `requestAnimationFrame` para scroll/gutter. Tab inserta 2 espacios. `toggleWrap` para markdown.
- `frontend/src/app/files.js`: usa binding Wails si existe, si no fallback navegador (`<input type=file>` + descarga `Blob`).
- `frontend/src/app/shortcuts.js`: Ctrl+N/O/S/Shift+S/W/F/H/B/I/Shift+X, buscador flotante (máx. 5000 matches).
- `frontend/src/app/app.js`: cableado, drag-to-move (doble-click alterna maximizar), Ctrl+rueda ajusta tamaño de fuente.
- `frontend/src/styles/`: `theme.css` (variables `--bg #111`, `--fg #e5e5e5`, `--gutter #555`), `editor.css`, `reset.css`. Sin frameworks.

## Dependencias

Frontend: **solo `vite` (devDependency)**. Resultado `pnpm build`: ~6.6 kB JS + ~1.6 kB CSS.
Go: `github.com/wailsapp/wails/v2`. Nada más. Sin analytics, sin CDN, sin fuentes remotas. Funciona offline.

## Estructura

```text
Sukoshi/
├── main.go / app.go / go.mod / wails.json
└── frontend/
    ├── index.html
    ├── package.json / vite.config.js / pnpm-lock.yaml
    └── src/
        ├── main.js
        ├── app/{app,editor,shortcuts,files,state}.js
        └── styles/{reset,theme,editor}.css
```
