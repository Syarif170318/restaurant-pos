@echo off
title Hubungkan GitHub
echo.
echo ========================================
echo   HUBUNGKAN AKUN GITHUB
echo ========================================
echo.
echo Browser akan terbuka.
echo Login pakai akun GitHub kamu (bukan password di chat!).
echo.
echo Tekan Enter untuk mulai...
pause >nul

where gh >nul 2>&1
if errorlevel 1 (
  echo GitHub CLI belum ada. Install dari: https://cli.github.com
  pause
  exit /b 1
)

gh auth login --hostname github.com --git-protocol https --web

echo.
gh auth status
echo.
echo Selesai. Kalau sudah "Logged in", bilang ke Cursor AI:
echo   "push project ke GitHub repo nama restaurant-pos"
echo.
pause
