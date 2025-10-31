@echo off
REM Pybricksdev Installer for Windows
REM Double-click this file to install pybricksdev

title Pybricks Runner - Setup Installer
color 0A

echo ==========================================
echo   Pybricks Runner - Setup Installer
echo ==========================================
echo.
echo This will install pybricksdev on your PC.
echo.

REM Set installation directory
set "VENV_DIR=%USERPROFILE%\.pybricks-venv"

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [X] Python is not installed!
    echo.
    echo Please install Python 3 from: https://www.python.org/downloads/
    echo Make sure to check 'Add Python to PATH' during installation.
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('python --version') do set PYTHON_VERSION=%%i
echo [✓] Python found: %PYTHON_VERSION%
echo.

REM Check if venv exists
if exist "%VENV_DIR%" (
    echo [!] Virtual environment already exists at: %VENV_DIR%
    set /p REINSTALL="Do you want to reinstall? (y/n): "
    if /i not "%REINSTALL%"=="y" (
        echo Installation cancelled.
        pause
        exit /b 0
    )
    echo [!] Removing old virtual environment...
    rmdir /s /q "%VENV_DIR%"
)

REM Create virtual environment
echo [*] Creating virtual environment at: %VENV_DIR%
python -m venv "%VENV_DIR%"

if errorlevel 1 (
    echo.
    echo [X] Failed to create virtual environment!
    echo Try running: python -m pip install --user virtualenv
    pause
    exit /b 1
)

echo [✓] Virtual environment created
echo.

REM Install directly in venv without activation (avoids PowerShell issues)
echo [*] Upgrading pip...
"%VENV_DIR%\Scripts\python.exe" -m pip install --upgrade pip >nul 2>&1

echo [*] Installing pybricksdev...
"%VENV_DIR%\Scripts\python.exe" -m pip install pybricksdev

if errorlevel 1 (
    echo.
    echo [X] Failed to install pybricksdev!
    echo Please check your internet connection and try again.
    pause
    exit /b 1
)

echo.
echo [✓] pybricksdev installed successfully!
echo.

REM Verify installation
"%VENV_DIR%\Scripts\pybricksdev.exe" --version
echo.

REM Create wrapper batch file in user's local bin
set "WRAPPER_DIR=%USERPROFILE%\AppData\Local\Microsoft\WindowsApps"
set "WRAPPER_SCRIPT=%WRAPPER_DIR%\pybricksdev.bat"

echo [*] Creating command wrapper...

REM Check if wrapper directory exists (it should on Windows 10+)
if exist "%WRAPPER_DIR%" (
    (
        echo @echo off
        echo "%VENV_DIR%\Scripts\pybricksdev.exe" %%*
    ) > "%WRAPPER_SCRIPT%"
    echo [✓] Command wrapper created at: %WRAPPER_SCRIPT%
) else (
    echo [!] Could not create wrapper (this is OK^)
    echo     The extension will still work using the venv directly
)

echo.
echo ==========================================
echo   [✓] Installation Complete!
echo ==========================================
echo.
echo pybricksdev is now installed at:
echo   %VENV_DIR%\Scripts\pybricksdev.exe
echo.
echo You can now use the Pybricks Runner extension!
echo.
echo To test if it works, you can run:
echo   "%VENV_DIR%\Scripts\pybricksdev.exe" --version
echo.
pause
