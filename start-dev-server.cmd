@echo off
setlocal

chcp 65001 >nul
cd /d "%~dp0"

if exist "%ProgramFiles%\nodejs\npm.cmd" (
  "%ProgramFiles%\nodejs\npm.cmd" run dev -- --hostname 0.0.0.0 --port 3000 > "%~dp0dev-server.log" 2> "%~dp0dev-server.err.log"
) else (
  npm.cmd run dev -- --hostname 0.0.0.0 --port 3000 > "%~dp0dev-server.log" 2> "%~dp0dev-server.err.log"
)
