#!/bin/bash

# Pybricksdev Installer for macOS
# Double-click this file to install pybricksdev

echo "=========================================="
echo "  Pybricks Runner - Setup Installer"
echo "=========================================="
echo ""
echo "This will install pybricksdev on your Mac."
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
VENV_DIR="$HOME/.pybricks-venv"

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed!"
    echo ""
    echo "Please install Python 3 from: https://www.python.org/downloads/"
    echo "Make sure to check 'Add Python to PATH' during installation."
    echo ""
    read -p "Press Enter to exit..."
    exit 1
fi

echo "✅ Python 3 found: $(python3 --version)"
echo ""

# Check if venv exists
if [ -d "$VENV_DIR" ]; then
    echo "📦 Virtual environment already exists at: $VENV_DIR"
    read -p "Do you want to reinstall? (y/n): " REINSTALL
    if [[ $REINSTALL != "y" && $REINSTALL != "Y" ]]; then
        echo "Installation cancelled."
        read -p "Press Enter to exit..."
        exit 0
    fi
    echo "🗑️  Removing old virtual environment..."
    rm -rf "$VENV_DIR"
fi

# Create virtual environment
echo "📦 Creating virtual environment at: $VENV_DIR"
python3 -m venv "$VENV_DIR"

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Failed to create virtual environment!"
    echo "Try installing venv: python3 -m pip install --user virtualenv"
    read -p "Press Enter to exit..."
    exit 1
fi

echo "✅ Virtual environment created"
echo ""

# Activate virtual environment
source "$VENV_DIR/bin/activate"

# Upgrade pip
echo "📦 Upgrading pip..."
python -m pip install --upgrade pip > /dev/null 2>&1

# Install pybricksdev
echo "📦 Installing pybricksdev..."
pip install pybricksdev

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Failed to install pybricksdev!"
    echo "Please check your internet connection and try again."
    read -p "Press Enter to exit..."
    exit 1
fi

echo ""
echo "✅ pybricksdev installed successfully!"
echo ""

# Verify installation
PYBRICKSDEV_VERSION=$("$VENV_DIR/bin/pybricksdev" --version 2>&1)
echo "📦 Installed: $PYBRICKSDEV_VERSION"
echo ""

# Create wrapper script
WRAPPER_SCRIPT="/usr/local/bin/pybricksdev"
echo "📝 Creating command wrapper..."

# Check if /usr/local/bin exists
if [ ! -d "/usr/local/bin" ]; then
    sudo mkdir -p /usr/local/bin
fi

# Try to create wrapper with sudo
if sudo bash -c "cat > $WRAPPER_SCRIPT << 'EOF'
#!/bin/bash
\"$VENV_DIR/bin/pybricksdev\" \"\$@\"
EOF
" 2>/dev/null && sudo chmod +x "$WRAPPER_SCRIPT" 2>/dev/null; then
    echo "✅ Command wrapper created at: $WRAPPER_SCRIPT"
else
    echo "⚠️  Could not create global wrapper (this is OK)"
    echo "   The extension will still work using the venv directly"
fi

echo ""
echo "=========================================="
echo "  ✅ Installation Complete!"
echo "=========================================="
echo ""
echo "pybricksdev is now installed at:"
echo "  $VENV_DIR/bin/pybricksdev"
echo ""
echo "You can now use the Pybricks Runner extension!"
echo ""
echo "To test if it works, you can run:"
echo "  $VENV_DIR/bin/pybricksdev --version"
echo ""
read -p "Press Enter to exit..."
