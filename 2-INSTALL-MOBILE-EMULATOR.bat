@echo off
title Install POS Mobile ke Emulator
echo.
echo [1] Nyalakan emulator dulu di Android Studio (tombol Play)
echo [2] Pastikan 1-JALANKAN-SERVER.bat sudah jalan
echo [3] Build pertama 5-15 menit, tunggu sampai selesai
echo.
set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
set "PATH=%JAVA_HOME%\bin;%PATH%"
cd /d "%~dp0pos-mobile"
call npm run android:build
echo.
echo Selesai. Buka app "Restaurant POS" di emulator.
echo Login: kasir1 / PIN 1111
pause
