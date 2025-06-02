
# Pybricks Runner for VSCode

**Pybricks Runner** is an VSCode extension that allows you to easily program and run your LEGO SPIKE Prime, EV3, and other Pybricks-compatible bricks directly from Visual Studio Code using the `pybricksdev` command-line tool.

---

## Features

- **One-click programming:** Easily program your LEGO brick directly from the VSCode editor.
- **Simple integration:** Runs the `pybricksdev run` command directly in the integrated VSCode terminal.
- **Immediate feedback:** Quickly see output and errors directly within VSCode.

---

## Screenshots

![screentshot showing the icon on the right activity bar](assets/screenshot.png)

---

## 🛠️ Installation

### Prerequisites

- [Visual Studio Code](https://code.visualstudio.com/)
- [pybricksdev](https://github.com/pybricks/pybricksdev) (`pip install pybricksdev`)

### Installing Extension

1. Clone or download this repository:

```bash
git clone https://github.com/yourusername/pybricks-runner-vscode.git
```

2. Open the folder in VSCode:

```bash
cd pybricks-runner-vscode
code .
```

3. Install dependencies and package the extension:

```bash
npm install -g vsce
npm install
vsce package
```

4. Install the `.vsix` extension file from VSCode:
   - Open VSCode
   - Go to Extensions (`Ctrl+Shift+X`)
   - Click on `...` and select "Install from VSIX"
   - Select the generated `.vsix` file

---

## Usage

- Open a Python (`.py`) file intended for LEGO Pybricks.
- Click on the "🚀 Run on LEGO Brick" button at the top right corner.

The extension will execute:
```bash
pybricksdev run yourfile.py
```

---

## Requirements

- Node.js LTS (18.x recommended)
- Python installed and configured (`pybricksdev`)
- Supported LEGO hardware (EV3, SPIKE Prime, etc.)

---

## 🙌 Contributing

Contributions are welcome! Feel free to open issues, submit pull requests, or suggest enhancements.

1. Fork this repository.
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request.

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

**Happy Building!**
