Write-Host "🚀 Iniciando servidor completo..." -ForegroundColor Green
Write-Host "📁 Backend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "📁 Frontend: http://localhost:5173" -ForegroundColor Magenta
Write-Host "⏹️  Presiona Ctrl+C para detener ambos servicios" -ForegroundColor Yellow
Write-Host ""

try {
    # Ejecutar ambos procesos en paralelo
    $backend = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -NoNewWindow -PassThru
    $frontend = Start-Process -FilePath "npm" -ArgumentList "run", "client" -NoNewWindow -PassThru
    
    # Esperar a que se presione Ctrl+C
    [Console]::CancelKeyPress += {
        Write-Host "`n🛑 Deteniendo servicios..." -ForegroundColor Red
        $backend.Kill()
        $frontend.Kill()
        exit
    }
    
    # Esperar a que ambos procesos terminen
    $backend.WaitForExit()
    $frontend.WaitForExit()
}
catch {
    Write-Host "Error al iniciar los servicios: $($_.Exception.Message)" -ForegroundColor Red
}
