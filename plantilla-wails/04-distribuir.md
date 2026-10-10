# 04 — Distribuir (portable)

Para uso personal / amigos: **portable .zip**, no instalador. El NSIS solo compensa si necesitas menú inicio, desinstalador o asociar extensiones.

## 1. Compilar en limpio

```powershell
cd frontend; pnpm build; cd ..
wails build   # → build/bin/MiApp.exe (~12 MB: Go + frontend embebido)
```

## 2. Empaquetar

El `.exe` es autocontenido (frontend, icono y código van dentro). Solo él al zip:

```powershell
Compress-Archive -LiteralPath "build\bin\MiApp.exe" -DestinationPath "build\bin\MiApp-0.1.0-windows-x64.zip" -Force
```

(~12 MB → ~5 MB.)

## 3. Publicar en GitHub Releases

```powershell
winget install --id GitHub.cli -e --source winget `
  --accept-source-agreements --accept-package-agreements
gh auth login   # una vez: navegador + código
gh release create v0.1.0 "build\bin\MiApp-0.1.0-windows-x64.zip" `
  --title "MiApp v0.1.0" `
  --notes "Portable Windows x64: descomprimir y ejecutar. Requiere WebView2."
```

## 4. Avisos honestos para quien descargue

- **WebView2**: preinstalado en Windows 11 y casi todo Windows 10. Sin él, el `.exe` no abre.
- **SmartScreen**: el binario no está firmado (un certificado cuesta ~200 €/año) → aviso de "aplicación no reconocida", `Más información → Ejecutar de todas formas`.
- **Estado no portable**: sesión y ajustes viven en `%APPDATA%\<App>.exe\EBWebView` del PC, no viajan con la carpeta. Un usuario nuevo arranca limpio.
