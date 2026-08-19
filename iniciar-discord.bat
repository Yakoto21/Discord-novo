@echo off
chcp 65001 >nul
title Discord Quantum - Inicializador Desktop
color 0B

echo ======================================================================
echo                 INICIANDO DISCORD QUANTUM...
echo ======================================================================
echo.

:: [1/2] Inicia o servidor em segundo plano
echo [1/2] Iniciando servidor do Discord Quantum...
start /b node dist/server.cjs

:: Pequena pausa para garantir que a porta 3000 ja esteja ouvindo
timeout /t 2 >nul

:: [2/2] Abre o aplicativo no navegador padrao
echo [2/2] Abrindo Discord Quantum na sua tela...
start http://localhost:3000

echo.
echo ======================================================================
echo       DISCORD QUANTUM ESTA RODANDO COM SUCESSO!
echo ======================================================================
echo.
echo  - Endereco Local: http://localhost:3000
echo  - Icone do App: Raio Azul Eletrico Ativo
echo.
echo  IMPORTANTE: Mantenha esta janela minimizada em segundo plano
echo  para manter o chat em tempo real e os canais de voz ativos.
echo.
echo Pressione Ctrl+C para encerrar o servidor quando terminar.
echo ======================================================================
echo.

:: Mantem o servidor ativo exibindo logs
node dist/server.cjs
