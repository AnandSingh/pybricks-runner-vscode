# Change Log

All notable changes to the "pybricks-runner" extension will be documented in this file.

## [0.3.1] - 2025-10-26

### 🐛 Bug Fixes
- **Fixed code-server and VSCodium compatibility** - Changed `extensionKind` to `["workspace", "ui"]` to ensure extension runs in workspace context where Node.js APIs are available
- Previously broke for browser-based VS Code environments (code-server, VSCodium) due to incorrect extension kind setting

### 📚 Documentation
- **Added comprehensive manual publishing guide** for maintainers
- Documented step-by-step process for publishing to VS Code Marketplace and Open VSX Registry
- Included token setup instructions and troubleshooting tips
- Added ready-to-use publishing script

### 🔧 Technical Changes
- Updated `extensionKind` from `["ui"]` to `["workspace", "ui"]` to support all environments
- Ensures extension works in VS Code, code-server, VSCodium, and other VS Code-compatible editors

## [0.3.0] - 2025-01-26

### 🎉 Major Features

#### Remote Workspace Support
- **SSH, WSL, and Dev Container support** - Extension now runs locally while workspace is remote
- Automatically syncs Python files from remote workspace to local machine for Bluetooth connectivity
- Works seamlessly with remote development - zero configuration needed!

#### Multi-File Project Support
- **Supports projects with multiple Python files and local imports**
- Automatically syncs all `.py` files while maintaining directory structure
- Imports like `from helpers import function` now work perfectly
- Project structure is preserved in temp directory

#### Easy Installation
- **One-click installers** for Windows and macOS
- `install-windows.bat` - Double-click installer for Windows
- `install-macos.command` - Double-click installer for macOS
- Creates isolated virtual environment at `~/.pybricks-venv`
- Extension automatically detects and uses venv installation

### ✨ Improvements

#### Robot Name Management
- Robot names now stored in VSCode global state (no more workspace files!)
- No more `.robotName` or `.robotNameList` files cluttering workspace
- Robot names persist across workspaces
- One-time migration from old file-based system

#### Better Error Handling
- Helpful error messages when pybricksdev is not installed
- "Easy Install" button opens installers folder automatically
- Installation guide link for manual installation
- Clear feedback in logs view for remote workspace operations

#### Virtual Environment Support
- Extension checks for pybricksdev in `~/.pybricks-venv` first
- Falls back to system installation if venv not found
- Works on both Windows and macOS

### 🐛 Bug Fixes
- Fixed extension running on remote host instead of local machine
- Fixed file path issues when using remote workspaces
- Fixed working directory for pybricksdev to support relative imports
- Fixed robot selection errors when workspace files don't exist

### 📚 Documentation
- Comprehensive installation guide for both platforms
- Remote workspace setup instructions
- Multi-file project examples
- Troubleshooting section with common issues

### 🔧 Technical Changes
- Changed `extensionKind` to `["ui"]` for local-only execution
- Added automatic file sync for remote workspaces
- Improved command execution logic for remote vs local
- Added startup check for pybricksdev installation

## [0.1.10] - Previous Release

- Initial marketplace release
- Basic pybricksdev integration
- Device scanning and selection
- Status bar integration
- Activity bar sidebar