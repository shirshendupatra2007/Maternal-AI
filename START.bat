@echo off
echo.
echo  ╔══════════════════════════════════════════════╗
echo  ║       🌸  MamaAI - Starting Up...  🌸       ║
echo  ╚══════════════════════════════════════════════╝
echo.

echo [1/2] Starting Backend Server (Port 5000)...
start "MamaAI Backend" cmd /k "cd /d D:\MY PROJECT\maternal-health\backend && node server.js"

timeout /t 3 /nobreak > nul

echo [2/2] Starting Frontend Dev Server (Port 5173)...
start "MamaAI Frontend" cmd /k "cd /d D:\MY PROJECT\maternal-health\frontend && npm run dev"

timeout /t 3 /nobreak > nul

echo.
echo  ✅ Both servers are running!
echo  ✨ MamaAI is live and connected with Google Gemini AI!
echo.
echo  📱 Open your browser at: http://localhost:5173
echo.
pause
