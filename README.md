
# Pybricks Runner for VSCode

[![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/AnandSingh.pybricks-runner)](https://marketplace.visualstudio.com/items?itemName=AnandSingh.pybricks-runner)
![Downloads](https://img.shields.io/visual-studio-marketplace/d/AnandSingh.pybricks-runner)
![Rating](https://img.shields.io/visual-studio-marketplace/r/AnandSingh.pybricks-runner)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![GitHub release](https://img.shields.io/github/v/release/AnandSingh/pybricks-runner-vscode)
![Platform](https://img.shields.io/badge/platform-VSCode-blue)

# Pybricks Runner for VSCode

<p align="center">
  <img src="pybricks-runner-icon.png" alt="Pybricks Runner Logo" width="128"/>
</p>


**Pybricks Runner** is an VSCode extension that allows you to easily program and run your LEGO SPIKE Prime, EV3, and other Pybricks-compatible bricks directly from Visual Studio Code using the `pybricksdev` command-line tool.

## Features

- **One-click programming:** Easily program your LEGO brick directly from the VSCode editor.
- **Simple integration:** Runs the `pybricksdev run` command directly in the integrated VSCode terminal.
- **Immediate feedback:** Quickly see output and errors directly within VSCode.

---

## Screenshots

![screentshot showing the icon on the right activity bar](assets/screenshot.png)

---

## 🎥 Demo

### 🚀 Flash Your Robot

![Flash Robot](assets/flash-my-robot.gif)

1. Open a `.py` file (e.g. `main.py`)
2. Click the 🚀 `Run on <RobotName>` button in the status bar
3. The terminal launches and executes:
   ```bash
   pybricksdev run ble --name "YourRobot" main.py


### ⚙️ Select or Change Robot Name

![Select Robot](assets/select-robot.gif)

1. Click the ⚙️ `Select or Change Robot` button top right or Press Ctrl+Shift+P → Select LEGO Robot 
2. Choose from the list in .robotNameList or enter a custom name
3. .robotName is updated
4. Status bar updates instantly


## 🛠️ Installation

### Prerequisites

- [Visual Studio Code](https://code.visualstudio.com/)
- [pybricksdev](https://github.com/pybricks/pybricksdev) (`pip install pybricksdev`)

## 🛠️ Installation

### 🧩 From VS Code Marketplace (Recommended for VS Code)

Install directly from the Visual Studio Code Marketplace:

[![Install from Marketplace](https://img.shields.io/badge/Install%20from-Marketplace-blue)](https://marketplace.visualstudio.com/items?itemName=AnandSingh.pybricks-runner)

1. Open VS Code
2. Go to Extensions (`Ctrl+Shift+X`)
3. Search for `pybricks-runner`
4. Click **Install**

---

### 🌐 From Open VSX (For VSCodium, code-server, Theia, etc.)

Install from Open VSX:

[![Install from Open VSX](https://img.shields.io/badge/OpenVSX-Pybricks--Runner-blue)](https://open-vsx.org/extension/AnandSingh/pybricks-runner)


### Manual Installing for development

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

4. Install as below 
```
code --install-extension pybricks-runner-<version>.vsix
```

Or Install the `.vsix` extension file from VSCode:
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

## 🧩 Troubleshooting

- **Error: 'pybricksdev' not found**  
  Make sure you've installed it globally using `pip install pybricksdev`.

- **Robot not connecting**  
  Ensure Bluetooth is enabled and your robot is turned on. Try re-pairing via your OS.

- **Web Bluetooth not available**  
  Check if you're using a Chromium browser and have enabled the `chrome://flags/#enable-web-bluetooth` flag.


---

## Requirements

- Node.js LTS (18.x recommended)
- Python installed and configured (`pybricksdev`)
- Supported LEGO hardware (EV3, SPIKE Prime, etc.)

---

## ✅ Web Bluetooth Setup for VSCode & code-server:

To enable Web Bluetooth:

1. **Open Chrome Flags**:  
   Go to `chrome://flags/#enable-web-bluetooth` and set it to **Enabled**.

2. **Use HTTPS or localhost**:  
   Web Bluetooth only runs in secure contexts.

3. **Browser Compatibility**:  
   Ensure you're using a Chromium-based browser (**Chrome, Edge**).

After enabling the flag, reload your VSCode web interface. Web Bluetooth functionality will then be available and reliable.


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