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
	// Una sola instancia: si ya hay otra, le pasamos los archivos y salimos.
	if !app.ensureSingleInstance(os.Args[1:]) {
		return
	}

	err := wails.Run(&options.App{
		Title:     "Sukoshi",
		Width:     900,
		Height:    650,
		Frameless: true,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		Bind: []interface{}{
			app,
		},
		OnStartup: app.startup,
		// Ventana translúcida: en Windows es lo único que permite ver a través
		// (sin esto el fondo transparente se ve blanco). Trae blur fijo del SO.
		Windows: &windows.Options{
			WebviewIsTransparent: true,
			WindowIsTranslucent:  true,
		},
		DragAndDrop: &options.DragAndDrop{
			EnableFileDrop: true,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
