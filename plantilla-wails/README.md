# Plantilla Go + Wails (Windows)

Guía probada en un proyecto real (Wails v2.16.0, Go 1.27.1) para dejar Go y Wails funcionando y que una IA pueda replicarlo en un proyecto nuevo sin tropezar con lo mismo.

## Contenido

1. [`01-instalacion.md`](01-instalacion.md) — instalar Go, Wails CLI, Node/pnpm y WebView2, con verificaciones.
2. [`02-proyecto.md`](02-proyecto.md) — estructura mínima (`wails.json`, `main.go`, `app.go`), contrato con el frontend y comandos de build.
3. [`03-problemas.md`](03-problemas.md) — todos los fallos que nos pasaron y su fix.
4. [`04-distribuir.md`](04-distribuir.md) — portable .zip + release en GitHub.

## Cómo usarla con tu IA

Pégale esto al inicio del proyecto nuevo (ajusta nombre y tamaño de ventana):

```text
Vas a crear una app de escritorio Windows con Wails v2 + Go y frontend Vite/Vanilla (pnpm, nunca npm).
Sigue al pie de la letra la plantilla de ./plantilla-wails/:
1. Instala y verifica todo según 01-instalacion.md (Go en PATH, `wails doctor` OK).
2. Monta la estructura según 02-proyecto.md. OBLIGATORIO: `OnStartup: app.startup`
   guardando el ctx, bind con `Bind: []interface{}{app}`, y frontend con
   `//go:embed all:frontend/dist`. Los métodos Go se llaman desde JS como
   `window.go.main.App.Metodo()` y el frontend SIEMPRE lleva fallback sin Wails.
3. Ante cualquier error, consulta 03-problemas.md antes de improvisar.
4. Para repartirla, sigue 04-distribuir.md (portable .zip, sin instalador).
```

## Checklist rápido

- [ ] `go version` → go1.27+ y `wails version` → v2.16+ responden en una terminal nueva.
- [ ] `wails doctor` sin errores (WebView2 instalado).
- [ ] `wails build` genera el `.exe` y abre sin cerrarse al usar diálogos (señal de `OnStartup` OK).
- [ ] El frontend funciona también con `pnpm dev` sin Wails (fallbacks).
- [ ] `.gitignore` ignora `build/bin/`, `dist/`, `vendor/`, `node_modules/` pero INCLUYE `build/windows/icon.ico`.
