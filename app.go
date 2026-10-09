package main

import (
	"archive/zip"
	"context"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type App struct {
	ctx context.Context
}

func NewApp() *App {
	return &App{}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

type OpenResult struct {
	Path    string `json:"path"`
	Name    string `json:"name"`
	Content string `json:"content"`
}

func (a *App) OpenAndRead() *OpenResult {
	path, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Abrir archivo",
		Filters: []runtime.FileFilter{
			{DisplayName: "Texto / Markdown", Pattern: "*.txt;*.md;*.markdown"},
			{DisplayName: "Código", Pattern: "*.html;*.css;*.js"},
			{DisplayName: "Todos", Pattern: "*.*"},
		},
	})
	if err != nil || path == "" {
		return nil
	}
	data, err := os.ReadFile(path)
	if err != nil {
		return nil
	}
	return &OpenResult{Path: path, Name: filepath.Base(path), Content: string(data)}
}

func (a *App) WriteFile(path string, content string) error {
	return os.WriteFile(path, []byte(content), 0644)
}

func (a *App) ReadFile(path string) (string, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return "", err
	}
	return string(data), nil
}

// Mtime en ms (-1 si no existe). Para detectar cambios externos.
func (a *App) Stat(path string) int64 {
	fi, err := os.Stat(path)
	if err != nil {
		return -1
	}
	return fi.ModTime().UnixMilli()
}

// Abre el HTML del playground en el navegador externo.
// No usa runtime.BrowserOpenURL porque Wails bloquea el esquema file://;
// se abre con el handler del SO vía rundll32 (solo Windows).
func (a *App) PreviewExternal(html string) error {
	f, err := os.CreateTemp("", "sukoshi-play-*.html")
	if err != nil {
		return err
	}
	name := f.Name()
	if _, err := io.WriteString(f, html); err != nil {
		f.Close()
		return err
	}
	f.Close()
	// El navegador necesita el archivo unos segundos; se limpia solo al minuto.
	time.AfterFunc(time.Minute, func() { os.Remove(name) })
	return exec.Command("rundll32", "url.dll,FileProtocolHandler", name).Start()
}

// Exporta los 3 buffers del playground como .zip.
func (a *App) ExportZip(html string, css string, js string) string {
	path, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		Title:           "Exportar playground",
		DefaultFilename: "sukoshi-play.zip",
		Filters: []runtime.FileFilter{
			{DisplayName: "ZIP", Pattern: "*.zip"},
		},
	})
	if err != nil || path == "" {
		return ""
	}
	f, err := os.Create(path)
	if err != nil {
		return ""
	}
	defer f.Close()
	w := zip.NewWriter(f)
	defer w.Close()
	for name, content := range map[string]string{"index.html": html, "style.css": css, "app.js": js} {
		fw, err := w.Create(name)
		if err != nil {
			return ""
		}
		if _, err := io.WriteString(fw, content); err != nil {
			return ""
		}
	}
	return path
}

func (a *App) SaveAs(content string, suggestedName string) string {
	if suggestedName == "" {
		suggestedName = "untitled.txt"
	}
	path, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		Title:           "Guardar como",
		DefaultFilename: suggestedName,
		Filters: []runtime.FileFilter{
			{DisplayName: "Markdown", Pattern: "*.md"},
			{DisplayName: "Texto", Pattern: "*.txt"},
			{DisplayName: "Código", Pattern: "*.html;*.css;*.js"},
			{DisplayName: "Todos", Pattern: "*.*"},
		},
	})
	if err != nil || path == "" {
		return ""
	}
	if err := os.WriteFile(path, []byte(content), 0644); err != nil {
		return ""
	}
	return path
}
