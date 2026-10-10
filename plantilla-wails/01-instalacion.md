# 01 — Instalación (Windows)

Orden estricto. Todo verificado con: Go 1.27.1, Wails v2.16.0, pnpm 11.5.2, Node 24.

## 1. Go

```powershell
winget install Go.Go
```

Cierra y reabre la terminal. Verifica:

```powershell
go version   # → go version go1.27.1 windows/amd64 (o superior)
```

Go vive en `C:\Program Files\Go\bin`. Si `go` no responde, añade esa ruta al `PATH` del sistema. En cada terminal **nueva** donde vayas a compilar, asegúrate de que el `PATH` incluye además la carpeta de binarios de Go del usuario:

```powershell
$env:PATH = "C:\Program Files\Go\bin;C:\Users\TU_USUARIO\go\bin;" + $env:PATH
```

(Sustituye `TU_USUARIO`. Sin esto, `wails` no se encuentra aunque esté instalado.)

## 2. Wails CLI

```powershell
go install github.com/wailsapp/wails/v2/cmd/wails@latest
wails version  # → v2.16.0 (o superior)
```

Esto deja el binario en `C:\Users\TU_USUARIO\go\bin\wails.exe` (de ahí el `PATH` del paso 1).

## 3. WebView2 (runtime del sistema)

Wails NO empaqueta Chromium: usa el WebView2 de Windows.

```powershell
wails doctor
```

Debe salir sin errores. Si falta, instálalo (viene preinstalado en Windows 11 y en casi todo Windows 10 actualizado). Sin esto, `wails build` compila pero el `.exe` no abre.

## 4. Node + pnpm (solo para el frontend)

```powershell
winget install OpenJS.NodeJS
corepack enable
corepack prepare pnpm@latest --activate
pnpm --version
```

**Nunca npm**: solo `pnpm install` / `pnpm dev` / `pnpm build`. Wails se instala vía `go install`, no vía pnpm.

## 5. Verificación final

```powershell
go version       # go1.27+
wails version    # v2.16+
wails doctor     # todo OK
pnpm --version   # responde
```

Si las 4 responden en una terminal recién abierta, el entorno está listo.
