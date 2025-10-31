# Windows Troubleshooting Guide

## Problem: "pybricksdev not found" error

If the extension can't find pybricksdev even after running the installer, follow these steps:

### Step 1: Check Debug Info

1. Open VS Code
2. Press `Ctrl+Shift+P`
3. Type: `Pybricks: Show Debug Info`
4. Press Enter

This will show you:
- Where the extension is looking for pybricksdev
- Whether the venv exists
- What files are in the venv directory

### Step 2: Verify Installation Path

The extension looks for pybricksdev at:
```
C:\Users\<YourUsername>\.pybricks-venv\Scripts\pybricksdev.exe
```

**Check if this file exists:**

1. Open File Explorer
2. Go to: `C:\Users\<YourUsername>`
3. Look for folder: `.pybricks-venv`
4. Inside it, go to: `Scripts`
5. Check if `pybricksdev.exe` exists

### Step 3: Solutions

#### Solution A: Re-run the Installer

1. Go to the extension folder:
   - In VS Code: View → Extensions → Pybricks Runner → ⚙️ → Extension Settings → scroll to find extension path
   - Or typically: `%USERPROFILE%\.vscode\extensions\anandsingh.pybricks-runner-*\installers\`

2. Double-click: `install-windows.bat`

3. When asked to reinstall, type `y` and press Enter

4. Wait for installation to complete

5. **Important:** Reload VS Code window after installation
   - Press `Ctrl+Shift+P`
   - Type: `Reload Window`
   - Press Enter

#### Solution B: Fix PowerShell Execution Policy (Common Issue!)

If you see "scripts is disabled on this system", this is a PowerShell security setting.

**Quick Fix - Use Command Prompt instead:**

1. Press `Win+R`
2. Type: `cmd` (NOT PowerShell!)
3. Press Enter
4. Run the commands below

**OR Allow Scripts in PowerShell:**

Open PowerShell as Administrator and run:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### Solution C: Manual Installation

Open **Command Prompt** (NOT PowerShell) and run:

```cmd
REM Create venv
python -m venv "%USERPROFILE%\.pybricks-venv"

REM Activate it
call "%USERPROFILE%\.pybricks-venv\Scripts\activate.bat"

REM Install pybricksdev
pip install pybricksdev

REM Verify installation
"%USERPROFILE%\.pybricks-venv\Scripts\pybricksdev.exe" --version
```

#### Solution D: System-wide Installation

If the venv approach doesn't work, install pybricksdev globally:

```cmd
pip install pybricksdev

REM Verify
pybricksdev --version
```

**Important:** After system-wide installation, add Python Scripts to PATH:
1. Search for "Environment Variables" in Windows
2. Edit "Path" variable
3. Add: `C:\Users\<YourUsername>\AppData\Local\Programs\Python\Python3X\Scripts`

### Step 4: Common Issues

#### Issue: "Python not found"

**Solution:**
1. Install Python from: https://www.python.org/downloads/
2. **IMPORTANT:** Check "Add Python to PATH" during installation
3. Restart your computer
4. Try again

#### Issue: "pip not found"

**Solution:**
```cmd
python -m ensurepip --upgrade
python -m pip install --upgrade pip
```

#### Issue: ".pybricks-venv exists but pybricksdev.exe is missing"

**Solution:**
```cmd
REM Delete old venv
rmdir /s /q "%USERPROFILE%\.pybricks-venv"

REM Run installer again
REM Go to: installers\install-windows.bat
```

#### Issue: "Permission denied"

**Solution:**
- Run Command Prompt as Administrator
- Or install in user directory (which the installer does by default)

### Step 5: Still Not Working?

If you've tried everything above:

1. Run the debug command: `Pybricks: Show Debug Info`
2. Take a screenshot of the output
3. Open an issue: https://github.com/AnandSingh/pybricks-runner-vscode/issues
4. Include:
   - The debug output
   - Your Python version: `python --version`
   - Your Windows version

### Quick Test

To test if pybricksdev is working, open Command Prompt and run:

```cmd
REM Test venv installation
"%USERPROFILE%\.pybricks-venv\Scripts\pybricksdev.exe" --version

REM Or test system installation
pybricksdev --version
```

If either works, reload VS Code window and try again.
