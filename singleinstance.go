package main

import (
	"bufio"
	"fmt"
	"net"
	"os"
	"strconv"
	"sync"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// Instancia única por usuario: la primera abre un socket local; las siguientes
// le reenvían sus archivos ("Abrir con") y se cierran. Solo stdlib, sin deps.
// Si el puerto lo ocupa un programa ajeno, se arranca degradado (sin ceder).
const (
	singleAddr  = "127.0.0.1:17421"
	singleToken = "sukoshi-v1"
)

var (
	remoteMu      sync.Mutex
	remoteQueue   []string
	frontendReady = false
)

// ensureSingleInstance devuelve false si hay que salir (otra instancia manda).
func (a *App) ensureSingleInstance(args []string) bool {
	if ln, err := net.Listen("tcp", singleAddr); err == nil {
		go a.acceptLoop(ln)
		return true
	}
	if sendToPrimary(args) {
		return false
	}
	// El dueño pudo morir entre el Listen y el Dial: reintentar una vez.
	// Si el puerto sigue ocupado por algo ajeno, degradado (sin ceder).
	if ln, err := net.Listen("tcp", singleAddr); err == nil {
		go a.acceptLoop(ln)
	}
	return true
}

func (a *App) acceptLoop(ln net.Listener) {
	for {
		conn, err := ln.Accept()
		if err != nil {
			return
		}
		go a.handleSecondary(conn)
	}
}

func (a *App) handleSecondary(conn net.Conn) {
	defer conn.Close()
	conn.SetDeadline(time.Now().Add(3 * time.Second))
	rd := bufio.NewReader(conn)
	token, err := rd.ReadString('\n')
	if err != nil || token != singleToken+"\n" {
		return
	}
	nLine, err := rd.ReadString('\n')
	if err != nil {
		return
	}
	n, err := strconv.Atoi(nLine[:len(nLine)-1])
	if err != nil || n < 0 || n > 32 {
		return
	}
	paths := make([]string, 0, n)
	for i := 0; i < n; i++ {
		line, err := rd.ReadString('\n')
		if err != nil {
			return
		}
		p := line[:len(line)-1]
		if fi, err := os.Stat(p); err == nil && !fi.IsDir() {
			paths = append(paths, p)
		}
	}
	fmt.Fprint(conn, "OK")
	a.deliverRemote(paths)
}

// Entrega a la ventana: evento si el frontend escucha, cola si aún arranca.
func (a *App) deliverRemote(paths []string) {
	if len(paths) == 0 {
		a.focusWindow()
		return
	}
	remoteMu.Lock()
	ready := frontendReady
	if !ready {
		remoteQueue = append(remoteQueue, paths...)
	}
	remoteMu.Unlock()
	if ready && a.ctx != nil {
		runtime.EventsEmit(a.ctx, "open-files", paths)
	}
	a.focusWindow()
}

func (a *App) focusWindow() {
	if a.ctx == nil {
		return
	}
	runtime.WindowUnminimise(a.ctx)
	runtime.WindowShow(a.ctx)
}

// La segunda instancia envía y sale. true = entregado, hay que terminar.
func sendToPrimary(args []string) bool {
	conn, err := net.DialTimeout("tcp", singleAddr, 2*time.Second)
	if err != nil {
		return false
	}
	defer conn.Close()
	conn.SetDeadline(time.Now().Add(2 * time.Second))
	out := bufio.NewWriter(conn)
	fmt.Fprintln(out, singleToken)
	fmt.Fprintln(out, len(args))
	for _, p := range args {
		fmt.Fprintln(out, p)
	}
	if err := out.Flush(); err != nil {
		return false
	}
	ack := make([]byte, 2)
	n, _ := conn.Read(ack)
	return string(ack[:n]) == "OK"
}
