# 03 — Problemas que ya nos pasaron (y su fix)

Lee esto ANTES de improvisar. Cada punto le costó tiempo a alguien.

## 1. La app se cierra sola al guardar / abrir diálogos

**Causa**: falta `OnStartup: app.startup` en `main.go` → `a.ctx` es `nil` → el primer `runtime.*Dialog` revienta el proceso.

**Fix**: añade `OnStartup: app.startup` y guarda el ctx (ver plantilla de `02-proyecto.md`). Señal de que está bien: los diálogos abren sin cerrar la app.

## 2. `wails` no se encuentra en una terminal nueva

**Causa**: el `PATH` no incluye `C:\Users\TU_USUARIO\go\bin` (donde `go install` dejó el binario) o ni siquiera `C:\Program Files\Go\bin`.

**Fix**: ver paso 1 de `01-instalacion.md`. Cada terminal automatizada debe prefijar el `PATH` a mano.

## 3. `window.go.main.App` es `undefined` en JS

**Causas, en orden**:
1. No has compilado: los bindings se generan con `wails build` / `wails dev`. En `pnpm dev` puro no existen (para eso es el fallback `hasWails()`).
2. El método Go no es público o no está en el struct del `Bind`.

**Fix**: compila primero, pregunta después.

## 4. `file://` no abre nada desde el frontend

**Causa**: Wails/WebView2 bloquea el esquema `file://` (también `window.open` a rutas locales).

**Fix**: no luches contra el WebView. Para "abrir en navegador externo", vuelca el HTML a un temporal desde Go y lánzalo con el handler del SO:

```go
f, _ := os.CreateTemp("", "miapp-*.html")
name := f.Name()
io.WriteString(f, html)
f.Close()
time.AfterFunc(time.Minute, func() { os.Remove(name) }) // limpieza
exec.Command("rundll32", "url.dll,FileProtocolHandler", name).Start()
```

## 5. Fondo transparente se ve blanco

**Causa**: en Windows el WebView solo deja ver a través con la ventana translúcida.

**Fix**: las dos opciones `WebviewIsTransparent: true` + `WindowIsTranslucent: true` en `main.go` (trae blur fijo del SO, no configurable).

## 6. La ventana maximizada pierde el resize / se comporta raro

**Causa**: con `Frameless: true`, el `enableResize` choca con el estado maximizado.

**Fix**: al maximizar, desactiva el resize (`enableResize: false`); reevalúalo en `mouseup`/`resize`. Si usas ventana clásica (`Frameless: false`), ignora este punto.

## 7. `wails build` falla por el frontend

**Causa**: `frontend/dist` no existe o está roto. Wails lo embebe con `//go:embed all:frontend/dist`: sin `pnpm build` previo no hay nada que embeber.

**Fix**: `cd frontend && pnpm build` antes de `wails build` (el propio `wails build` ya lo intenta con `frontend:build`, pero si falla ahí, el error real está en Vite, no en Go).

## 8. El Explorador sigue mostrando el icono viejo tras cambiarlo

**Causa**: caché de iconos de Windows, no tu build. El `.exe` ya lleva el nuevo (la barra de tareas lo muestra bien).

**Fix**:

```powershell
ie4uinit.exe -ClearIconCache
Stop-Process -Name explorer -Force  # se reinicia solo
```

## 9. En el PC destino pide WebView2 o SmartScreen avisa

No es un bug: el `.exe` no incluye Chromium (usa el del sistema) y no está firmado. Ver `04-distribuir.md`.
