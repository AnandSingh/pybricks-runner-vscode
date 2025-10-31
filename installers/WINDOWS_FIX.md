# Windows "Scripts Disabled" Error - Quick Fix

## Problem

When you see this error:
```
scripts is disabled on this system
```

This means PowerShell's execution policy is blocking the script.

## Solution 1: Use Command Prompt Instead (Easiest!)

**Don't use PowerShell. Use Command Prompt:**

1. Press `Win+R`
2. Type: `cmd`
3. Press Enter
4. Navigate to the installers folder:
   ```cmd
   cd %USERPROFILE%\.vscode\extensions\anandsingh.pybricks-runner-*\installers
   ```
5. Run: `install-windows.bat`

## Solution 2: Fix PowerShell Execution Policy

If you want to use PowerShell:

1. **Open PowerShell as Administrator:**
   - Press `Win+X`
   - Select "Windows PowerShell (Admin)" or "Terminal (Admin)"

2. **Run this command:**
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

3. **Type `Y` and press Enter**

4. **Now run the installer again**

## Solution 3: Manual Installation (No Scripts Needed)

Open Command Prompt (NOT PowerShell) and run these commands one by one:

```cmd
REM Create virtual environment
python -m venv "%USERPROFILE%\.pybricks-venv"

REM Install pybricksdev directly (no activation needed!)
"%USERPROFILE%\.pybricks-venv\Scripts\python.exe" -m pip install --upgrade pip
"%USERPROFILE%\.pybricks-venv\Scripts\python.exe" -m pip install pybricksdev

REM Verify installation
"%USERPROFILE%\.pybricks-venv\Scripts\pybricksdev.exe" --version
```

If you see a version number, it worked!

**After installation:**
1. Reload VS Code window (Ctrl+Shift+P → "Reload Window")
2. Try using the extension again

## Why This Happens

Windows has a security feature that blocks PowerShell scripts by default. The installer uses `.bat` files which work in Command Prompt but may have issues in PowerShell.

**Always use Command Prompt (cmd.exe) for running .bat files on Windows!**
