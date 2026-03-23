@echo off
REM Local Development Setup Script for SAP CAP Java Project (Windows)

echo.
echo ================================================
echo SAP CAP Java Project - Local Setup (Windows)
echo ================================================
echo.

REM Check Java
where java >nul 2>nul
if errorlevel 1 (
    echo X Java not found. Please install Java 21
    exit /b 1
)
echo [OK] Java found
for /f tokens^=2 %%j in ('java -version 2^>^&1 ^| find /i "version"') do set JAVA_VER=%%j
echo     Version: %JAVA_VER%

REM Check Node.js
where node >nul 2>nul
if errorlevel 1 (
    echo X Node.js not found. Please install Node.js v18+
    exit /b 1
)
echo [OK] Node.js found
for /f %%i in ('node --version') do set NODE_VER=%%i
echo     Version: %NODE_VER%

REM Check Maven
where mvn >nul 2>nul
if errorlevel 1 (
    echo X Maven not found. Please install Maven 3.6+
    exit /b 1
)
echo [OK] Maven found

echo.
echo Installing dependencies...
call npm install

echo.
echo Building Java service...
cd srv
call mvn clean package -DskipTests=true --batch-mode -q
cd ..

echo.
echo ================================================
echo Setup Complete!
echo ================================================
echo.
echo To start the development server, run:
echo   cds watch
echo.
echo The application will be available at:
echo   http://localhost:4004
echo.
pause
