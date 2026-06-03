@echo off
REM =========================================================
REM MICKA OIL PRICE UPDATE LAUNCHER
REM Runs update-prices.ps1 from this folder.
REM =========================================================
setlocal
set "SCRIPT_DIR=%~dp0"
powershell -ExecutionPolicy Bypass -File "%SCRIPT_DIR%update-prices.ps1"
echo.
pause
