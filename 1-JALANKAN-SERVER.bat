@echo off
title POS Server + Dashboard
echo.
echo [1] Pastikan XAMPP MySQL sudah START (hijau)
echo [2] Dashboard: http://localhost:3001
echo [3] Login: admin / password123
echo.
echo Jangan tutup jendela ini.
echo.
cd /d "%~dp0pos-app"
npm run dev
pause
