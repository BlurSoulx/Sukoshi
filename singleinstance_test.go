package main

import (
	"os"
	"path/filepath"
	"testing"
	"time"
)

// Handoff real por el socket local: test de integración ligero.
func TestSingleInstanceQueue(t *testing.T) {
	dir := t.TempDir()
	f1 := filepath.Join(dir, "a.txt")
	f2 := filepath.Join(dir, "b.md")
	if err := os.WriteFile(f1, []byte("hola"), 0644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(f2, []byte("mundo"), 0644); err != nil {
		t.Fatal(err)
	}

	primary := &App{}
	if !primary.ensureSingleInstance(nil) {
		t.Fatal("la primera instancia debería ser primaria")
	}
	time.Sleep(200 * time.Millisecond)

	// Segunda instancia: debe ceder (false) tras entregar.
	secondary := &App{}
	if secondary.ensureSingleInstance([]string{f1, "no-existe-xyz", f2}) {
		t.Fatal("la segunda instancia debería ceder y salir")
	}

	deadline := time.Now().Add(3 * time.Second)
	for {
		remoteMu.Lock()
		n := len(remoteQueue)
		remoteMu.Unlock()
		if n == 2 {
			break
		}
		if time.Now().After(deadline) {
			t.Fatalf("la cola remota tiene %d rutas, esperaba 2", n)
		}
		time.Sleep(50 * time.Millisecond)
	}

	// El drain del arranque devuelve la cola y marca listo.
	got := primary.ConsumePendingFiles()
	if len(got) != 2 || got[0] != f1 || got[1] != f2 {
		t.Fatalf("drain inesperado: %v", got)
	}
	remoteMu.Lock()
	ready := frontendReady
	empty := len(remoteQueue) == 0
	remoteMu.Unlock()
	if !ready || !empty {
		t.Fatal("tras el drain: listo y cola vacía")
	}
	frontendReady = false
}
