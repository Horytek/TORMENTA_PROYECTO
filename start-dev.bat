@echo off
echo Iniciando el servidor completo...
echo.
echo Backend y Frontend se ejecutarán en paralelo
echo Backend: http://localhost:3000
echo Frontend: http://localhost:5173
echo.
echo Presiona Ctrl+C para detener ambos servicios
echo.

npm run dev:fullstack
