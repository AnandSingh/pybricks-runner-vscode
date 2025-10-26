# Pybricks Runner - Easy Installers

This folder contains simple installers to help you quickly set up pybricksdev on your computer.

## 🚀 Quick Start

### For macOS Users:
**Double-click** `install-macos.command`

### For Windows Users:
**Double-click** `install-windows.bat`

---

## What These Installers Do

Both installers will:

1. ✅ Check if Python 3 is installed on your computer
2. ✅ Create a dedicated virtual environment at `~/.pybricks-venv` (macOS) or `%USERPROFILE%\.pybricks-venv` (Windows)
3. ✅ Install pybricksdev and all its dependencies
4. ✅ Set up the environment so the Pybricks Runner extension can find it automatically
5. ✅ Create command wrappers so you can use `pybricksdev` from anywhere

---

## Requirements

- **Python 3.8 or higher** must be installed on your computer
- **Internet connection** to download pybricksdev

If Python is not installed:
- Download from: https://www.python.org/downloads/
- **Windows:** Make sure to check "Add Python to PATH" during installation
- **macOS:** Python 3 is usually pre-installed, or install via Homebrew

---

## Troubleshooting

### macOS: "Cannot be opened because it is from an unidentified developer"

1. Right-click (or Control-click) on `install-macos.command`
2. Select "Open" from the menu
3. Click "Open" in the dialog that appears
4. The installer will run in Terminal

### Windows: "Windows protected your PC"

1. Click "More info"
2. Click "Run anyway"
3. The installer will run in Command Prompt

### Python Not Found

If the installer says Python is not installed:

**macOS:**
```bash
# Check if Python is installed
python3 --version

# If not, install via Homebrew
brew install python3

# Or download from python.org
```

**Windows:**
1. Download Python from: https://www.python.org/downloads/
2. Run the installer
3. **Important:** Check "Add Python to PATH" during installation
4. Restart your computer
5. Run the installer again

---

## What Gets Installed

- **Location:** `~/.pybricks-venv/` (macOS) or `%USERPROFILE%\.pybricks-venv\` (Windows)
- **Package:** pybricksdev and all its dependencies
- **Command wrapper:** Allows the extension to automatically find pybricksdev

---

## Uninstalling

To uninstall, simply delete the virtual environment folder:

**macOS:**
```bash
rm -rf ~/.pybricks-venv
```

**Windows:**
```cmd
rmdir /s /q "%USERPROFILE%\.pybricks-venv"
```

---

## Need Help?

- Check the main README: [../README.md](../README.md)
- Open an issue: https://github.com/AnandSingh/pybricks-runner-vscode/issues
- Pybricksdev documentation: https://github.com/pybricks/pybricksdev

---

**Happy Building! 🤖**
