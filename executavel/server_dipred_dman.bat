@echo off
title DIPRED-DMAN - Sistema de Orcamento de Engenharia

rem Sempre trabalha a partir da pasta onde este .bat esta, seja qual for o computador/caminho.
cd /d "%~dp0"

set "JAR="
for %%f in (*.jar) do set "JAR=%%f"

if not defined JAR (
    echo Nenhum arquivo .jar encontrado em: %~dp0
    echo Coloque o .jar na mesma pasta deste arquivo .bat.
    pause
    exit /b 1
)

where java >nul 2>&1
if errorlevel 1 (
    echo Java nao encontrado neste computador. Instale o Java 17 ou superior.
    pause
    exit /b 1
)

echo Iniciando o servidor DIPRED-DMAN...
echo Arquivo: %JAR%
echo Acesse http://localhost:8082 apos a inicializacao.
echo.
echo Para ENCERRAR o servidor: feche esta janela ou pressione CTRL+C.
echo.

java -jar "%JAR%"

echo.
echo Servidor encerrado.
pause
