@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo === Publishing "Mama's Recipes" to GitHub Pages ===
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0publish-to-github.ps1"
echo.
echo (Press any key to close this window)
pause >nul
