# 02 — Estructura mínima del proyecto

```
MiApp/
├── main.go          # ventana + arranque Wails
├── app.go           # backend: SOLO filesystem + diálogos
├── go.mod           # module miapp / go 1.25+ / require wails/v2
├── wails.json       # config del proyecto
├── frontend/        # Vite + Vanilla (pnpm)
│   ├── index.html
│   ├── package.json
│   └── src/
└── build/
    ├── bin/         # ← IGNORADO en git (aquí cae el .exe)
    └── windows/
        ├── icon.ico # ← INCLUIDO en git (el icono sí se versiona)
        ├── info.json
        └── wails.exe.manifest
```

## wails.json

```json
{
  "$schema": "https://wails.io/schemas/config.v2.json",
  "name": "MiApp",
  "outputfilename": "MiApp",
  "frontend:dir": "frontend",
  "frontend:install": "pnpm install",
  "frontend:build": "pnpm build",
  "frontend:dev:watcher": "pnpm dev",
  "frontend:dev:url": "http://localhost:34115"
}
```

## main.go (plantilla completa y comentada)

```go
package main

import (
	"embed"
	"os"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	// "Abrir con" de Windows llega como argumentos (el drop va por OnFileDrop).
	app := NewApp(os.Args[1:])

	err := wails.Run(&options.App{
		Title:     "MiApp",
		Width:     900,
		Height:    650,
		Frameless: true, // false si quieres la ventana clásica del SO
		AssetServer: &assetserver.Options{
			Assets: assets, // el frontend compilado va EMBEBIDO en el .exe
		},
		Bind: []interface{}{
			app, // expone los métodos de app.go al frontend
		},
		// OBLIGATORIO: sin OnStartup el ctx queda a nil y la app
		// se cierra sola al primer diálogo/guardado (ver 03-problemas.md).
		OnStartup: app.startup,
		// Solo si quieres fondo transparente/blur del SO. Sin estas dos
		// líneas, un fondo transparente se ve BLANCO en Windows.
		Windows: &windows.Options{
			WebviewIsTransparent: true,
			WindowIsTranslucent:  true,
		},
		DragAndDrop: &options.DragAndDrop{
			EnableFileDrop: true, // nil si no quieres drop de archivos
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
```

## app.go (patrón de bindings)

```go
package main

import (
	"context"
	"os"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type App struct {
	ctx context.Context
	// Rutas de "Abrir con" (Windows las pasa como args del .exe).
	pendingFiles []string
}

func NewApp(args []string) *App {
	var pending []string
	for _, a := range args {
		if fi, err := os.Stat(a); err == nil && !fi.IsDir() {
			pending = append(pending, a)
		}
	}
	return &App{pendingFiles: pending}
}

// Guarda el ctx: TODOS los runtime.*Dialog lo necesitan.
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// El frontend la llama al arrancar para abrir lo de "Abrir con" (una vez).
func (a *App) ConsumePendingFiles() []string {
	p := a.pendingFiles
	a.pendingFiles = nil
	if p == nil {
		return []string{}
	}
	return p
}

func (a *App) OpenAndRead() (map[string]string, error) {
	path, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Abrir archivo",
		Filters: []runtime.FileFilter{
			{DisplayName: "Texto", Pattern: "*.txt;*.md"},
		},
	})
	if err != nil || path == "" {
		return nil, err
	}
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	return map[string]string{"path": path, "content": string(data)}, nil
}

func (a *App) WriteFile(path string, content string) error {
	return os.WriteFile(path, []byte(content), 0644)
}

func (a *App) SaveAs(content string, suggestedName string) string {
	if suggestedName == "" {
		suggestedName = "untitled.txt"
	}
	path, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		Title:           "Guardar como",
		DefaultFilename: suggestedName,
	})
	if err != nil || path == "" {
		return ""
	}
	if err := os.WriteFile(path, []byte(content), 0644); err != nil {
		return ""
	}
	return path
}
```

Reglas del backend:

- `app.go` = **solo** filesystem + diálogos + utilidades del SO. Cero lógica de UI/editor.
- Todo método que uses desde JS debe ser **público** (`Mayúscula`) y estar en el struct bindeado.
- Los bindings `window.go.main.App.*` **se generan al compilar**: si JS dice `undefined`, es que falta `wails build` (o `wails dev`), no que el método esté mal.

## Contrato con el frontend

El paquete Go se llama `main` → los métodos cuelgan de **`window.go.main.App.Metodo()`**. Patrón obligatorio en cada llamada:

```js
const hasWails = () => typeof window.go?.main?.App !== 'undefined'

export async function openFile() {
  if (hasWails()) {
    const res = await window.go.main.App.OpenAndRead()
    if (!res) return null // diálogo cancelado
    return res
  }
  // Fallback navegador (pnpm dev sin Wails): <input type="file"> / descarga.
  // La app DEBE funcionar en `pnpm dev` sin el backend.
}
```

## Icono

- Va en `build/windows/icon.ico` (multi-tamaño 16→256). No existe hasta el primer `wails build`.
- Para versionarlo, genera el `.ico` desde tu `.png` (cuadrado, p. ej. 1024+) con Pillow:

```powershell
python -c "from PIL import Image; Image.open('miapp.png').save('build/windows/icon.ico', sizes=[(16,16),(24,24),(32,32),(48,48),(64,64),(128,128),(256,256)])"
```

- `.gitignore` recomendado:

```text
node_modules/
dist/
build/bin/
frontend/node_modules/
frontend/dist/
*.exe
vendor/
frontend/wailsjs/
```

OJO: `build/bin/` y NO `build/` a secas, para que `icon.ico`, `appicon.png` e `info.json` sí entren en git.

## Comandos

```powershell
# Desarrollo (recarga en vivo, requiere Go + Wails)
wails dev

# Solo frontend en navegador (sin backend, con fallbacks)
cd frontend; pnpm install; pnpm dev   # http://localhost:34115/

# Producción
cd frontend; pnpm build; cd ..
wails build   # → build/bin/MiApp.exe

# Dependencias Go fijadas en el repo (evita sorpresas de red):
go mod vendor
```
