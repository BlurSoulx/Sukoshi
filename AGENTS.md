# AGENTS.md — contexto para IAs que trabajen en Sukoshi

## Qué es

Editor minimalista `.txt`/`.md` + playground web (HTML/CSS/JS con preview vivo).
App de escritorio Windows: **Wails v2 (Go) + frontend Vanilla JS (Vite)**. Sin frameworks,
sin Electron, sin CDN, sin telemetría. Funciona offline. Filosofía: el editor es el
producto, la interfaz casi no existe (ver `Sukoshi.md` con la especificación original).

## Stack y reglas duras

- **Solo pnpm, nunca npm.** Wails se instala vía `go install`, no vía pnpm.
- Frontend: HTML/CSS/JS vanilla, ES Modules. Backend: Go solo filesystem + diálogos + SO.
- Métodos Go → JS como `window.go.main.App.Metodo()` (paquete `main`). Se generan con
  `wails build` / `wails dev`; en `pnpm dev` no existen → **todo acceso lleva
  `hasWails()` + fallback de navegador**. La app debe bootear sin backend.
- `main.go`: OBLIGATORIO `OnStartup: app.startup` guardando el ctx (sin esto, crash al
  primer diálogo). Frontend embebido con `//go:embed all:frontend/dist`.
- Nunca `go build` / `go run` a pelo: falla por build tags. Siempre `wails build`
  (o `go build -tags desktop,production`).

## Comandos

```powershell
cd frontend; pnpm install; pnpm dev    # solo frontend: http://localhost:34115/
wails dev                              # app completa con recarga
cd frontend; pnpm build; cd ..; wails build   # → build/bin/Sukoshi.exe
node themes-test.mjs && node emmet-test.mjs && node hl-css-test.mjs  # tests (desde frontend/)
go test ./...                          # tests Go (single-instance, etc.)
```

PATH necesario en terminales nuevas: `C:\Program Files\Go\bin` + `~/go/bin`.

## Convenciones de código

- Commits: `Sukoshi: <qué, en minúsculas, conciso>`.
- i18n ES/EN en `frontend/src/app/i18n.js`: estático con `data-i18n` + `applyI18n()`,
  dinámico con `t()` evaluado en cada apertura/render. Cuidado con variables locales
  llamadas `t` que eclipsan el import (ya mordió en `footer.js` y `play.js`).
- Settings en `sukoshi-settings-v1`, sesión en `sukoshi-session-v1`, playground en
  `sukoshi-play-*`, idioma en `sukoshi-lang`. Estado web en `%APPDATA%\Sukoshi.exe\EBWebView`
  (por usuario de Windows, compartido entre copias del exe).
- Menús/paneles flotantes usan `--menu-bg` (deriva de `--search-bg`, sigue a cada tema).
- Acento en `--accent` con contraste en `--on-accent`. Foco visible siempre en acento.
- Editores: instancias de `createEditor` (principal + 3 panes). Índice `lineStarts[]`
  cacheado; `lineCol()` para posición sin escanear. Playground con init perezoso.
- `adoptFile` deduplica por ruta (insensible a mayúsculas). `closeTab` + descarte al
  salir limpia el doc. Tabs vírgenes no se guardan en sesión; `untitled` se renumera
  al restaurar. Primer guardado de un doc restaurado pregunta (Guardar aquí / como).
- Instancia única por socket `127.0.0.1:17421` (`singleinstance.go` + evento
  `open-files`); test en `singleinstance_test.go`. "Abrir con" llega por `os.Args`.
- Temp de "abrir en navegador" se autoborra al minuto (`app.go`).

## Versionado (SemVer estricto)

`MAYOR.MENOR.PARCHE` (tags `vX.Y.Z` + release portable en GitHub):

- **PARCHE** (`0.2.0` → `0.2.1`): fix mínimo, sin cambios visibles grandes. Ej.: este guard de guardado.
- **MENOR** (`0.2.0`): funcionalidad nueva compatible. Ej.: "Abrir con", instancia única, idiomas.
- **MAYOR** (`1.0.0`): ruptura o reescritura. Reservado.

Al publicar versión: rebuild limpio → zip `Sukoshi-X.Y.Z-windows-x64.zip` →
`gh release create vX.Y.Z` con notas → actualizar enlaces del README + sección en
`CHANGELOG.md` → commit. Detalle e historial de features en `CHANGELOG.md`, no en README.

## Trampas del entorno (no repetir)

- **Lanzar la app desde terminal de administrador = ventana muerta** (WebView2 se niega
  a arrancar elevado: sin `OnStartup`, sin frontend, sin eventos). Probar siempre sin elevar
  (`runas /trustlevel:0x20000` si hace falta). El Go puro (sockets, tests) no se ve afectado.
- `Get-NetTCPConnection` a veces no muestra listeners activos: reintentar antes de concluir.
- Edge headless para harnesses: **perfil `user-data-dir` fresco en cada run** (el reutilizado
  sirve JS cacheado) + servidor `python -m http.server` + `importmap` para bare imports.
- Caché de iconos de Windows: `ie4uinit.exe -ClearIconCache` + reiniciar explorer.
- `.gitignore` ignora `build/bin/` pero INCLUYE `build/windows/icon.ico` (si no, un clon
  fresco no compila igual). El `.exe` nunca entra en git; se distribuye por Releases.
- `toast._t`-style: no usar globales implícitos por `id`; variables locales.
