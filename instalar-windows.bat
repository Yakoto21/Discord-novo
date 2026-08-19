@echo off
chcp 65001 >nul
title Discord Quantum - Instalador Oficial
color 0B

echo ======================================================================
echo           DISCORD QUANTUM - INSTALADOR OFICIAL WINDOWS
echo ======================================================================
echo.
echo [1/4] Verificando ambiente...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [INFO] Instalando Node.js automaticamente...
    where winget >nul 2>nul
    if %errorlevel% equ 0 (
        winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
        echo Concluido. Por favor, reabra este arquivo para finalizar.
        pause
        exit /b 0
    ) else (
        echo [ERRO] Node.js necessario: https://nodejs.org
        pause
        exit /b 1
    )
)
echo [OK] Ambiente detectado!
echo.

echo [2/4] Preparando dependencias...
call npm install --prefer-offline --no-audit --no-fund --loglevel=error
if %errorlevel% neq 0 (
    echo [ERRO] Falha ao preparar dependencias.
    pause
    exit /b 1
)
echo [OK] Dependencias prontas!
echo.

echo [3/4] Compilando executavel e interface...
call npm run build
if %errorlevel% neq 0 (
    echo [ERRO] Falha na compilacao.
    pause
    exit /b 1
)
echo [OK] Aplicativo compilado!
echo.

echo [4/4] Criando atalho nativo na Area de Trabalho (Modo Silencioso Sem Prompt)...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut([System.IO.Path]::Combine([System.Environment]::GetFolderPath('Desktop'), 'Discord Quantum.lnk')); $s.TargetPath = 'wscript.exe'; $s.Arguments = '\"' + [System.IO.Path]::Combine((Get-Location).Path, 'Discord-Quantum.vbs') + '\"'; $s.WorkingDirectory = (Get-Location).Path; $s.Description = 'Discord Quantum - Aplicativo Desktop'; $s.Save()"
echo [OK] Atalho nativo 'Discord Quantum' criado na sua Area de Trabalho!
echo.

echo ======================================================================
echo      INSTALACAO CONCLUIDA! ABRINDO DISCORD QUANTUM DIRETO...
echo ======================================================================
echo.
wscript "%CD%\Discord-Quantum.vbs"
timeout /t 2 >nul
exit /b 0
