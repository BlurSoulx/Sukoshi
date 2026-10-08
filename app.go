package main

import (
	"context"
	"os"
	"path/filepath"

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
