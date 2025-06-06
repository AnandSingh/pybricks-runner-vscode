// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Extension "pybricks-runner" is now active!');

	// System Bluetooth command
    context.subscriptions.push(vscode.commands.registerCommand('pybricks.run', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active Python file!');
            return;
        }
        const document = editor.document;
        const filePath = document.fileName;
        if (!filePath.endsWith('.py')) {
            vscode.window.showErrorMessage('Please open a Python (.py) file.');
            return;
        }
        const workspaceFolder = vscode.workspace.workspaceFolders[0].uri.fsPath;
        const robotNameFile = path.join(workspaceFolder, '.robotName');

        let cmd = '';
        if (fs.existsSync(robotNameFile)) {
            const robotName = fs.readFileSync(robotNameFile, 'utf8').trim();
            cmd = robotName
                ? `pybricksdev run ble --name "${robotName}" "${filePath}"`
                : `pybricksdev run ble "${filePath}"`;
        } else {
            cmd = `pybricksdev run ble "${filePath}"`;
        }

        const terminal = vscode.window.createTerminal("Pybricks");
        terminal.show();
        terminal.sendText(cmd);
        vscode.window.showInformationMessage('Programming brick via system Bluetooth...');
    }));

    // Web Bluetooth command
    context.subscriptions.push(vscode.commands.registerCommand('pybricks.runWebBluetooth', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active Python file!');
            return;
        }
        const scriptContent = editor.document.getText();

        const panel = vscode.window.createWebviewPanel(
            'pybricksWebBluetooth',
            'Pybricks Web Bluetooth Runner',
            vscode.ViewColumn.One,
            { enableScripts: true }
        );

        panel.webview.html = getWebviewContent();

        // Webview messaging
        panel.webview.onDidReceiveMessage(
            message => {
                if (message.command === 'requestScript') {
                    panel.webview.postMessage({
                        command: 'sendScript',
                        content: scriptContent
                    });
                }
            },
            undefined,
            context.subscriptions
        );
    }));
 // Web Bluetooth command
    context.subscriptions.push(vscode.commands.registerCommand('pybricks.runWebBluetooth', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active Python file!');
            return;
        }
        const scriptContent = editor.document.getText();

        const panel = vscode.window.createWebviewPanel(
            'pybricksWebBluetooth',
            'Pybricks Web Bluetooth Runner',
            vscode.ViewColumn.One,
            { enableScripts: true }
        );

        panel.webview.html = getWebviewContent();

        // Webview messaging
        panel.webview.onDidReceiveMessage(
            message => {
                if (message.command === 'requestScript') {
                    panel.webview.postMessage({
                        command: 'sendScript',
                        content: scriptContent
                    });
                }
            },
            undefined,
            context.subscriptions
        );
    }));
}

function getWebviewContent() {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; connect-src *; style-src 'unsafe-inline';">
            <title>Pybricks Web Bluetooth Runner</title>
        </head>
        <body>
            <h2>Pybricks Web Bluetooth Runner 🌐</h2>
            <button id="runButton">Connect & Run</button>
            <pre id="output"></pre>

           

            <script>
document.getElementById('runButton').addEventListener('click', async () => {
    if (!navigator.bluetooth) {
        document.getElementById('output').textContent = 
            "Web Bluetooth not available. Ensure you run this on HTTPS or localhost in Chrome.";
        return;
    }
    document.getElementById('output').textContent = "Connecting via Web Bluetooth...";
    try {
        const device = await navigator.bluetooth.requestDevice({
            acceptAllDevices: true // Basic test (adjust later for specific services)
        });
        const server = await device.gatt.connect();
        document.getElementById('output').textContent = "Connected to " + device.name;
    } catch (error) {
        document.getElementById('output').textContent = 'Error: ' + error;
    }
});
</script>

              
        </body>
        </html>
    `;
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
