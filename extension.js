// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

function updateStatusBarText(statusBarItem) {
	let robotName = 'LEGO Bricks';

	const workspaceFolders = vscode.workspace.workspaceFolders;
	if (workspaceFolders && workspaceFolders.length > 0) {
		const workspacePath = workspaceFolders[0].uri.fsPath;
		const robotNameFile = path.join(workspacePath, '.robotName');
		try {
			if (fs.existsSync(robotNameFile)) {
				const name = fs.readFileSync(robotNameFile, 'utf8').trim();
				if (name) robotName = name;
			}
		} catch (err) {
			console.warn('Failed to read .robotName:', err.message);
		}
	}

	statusBarItem.text = `$(rocket) Run on ${robotName}`;
	statusBarItem.tooltip = `Run current Python file on ${robotName}`;
	statusBarItem.show();

	return robotName;
}



/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Extension "pybricks-runner" is now active!');
         	// Update robot name dynamically before running
    // === Status bar item: "Run on <robotName>" ===
	const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    statusBarItem.command = 'pybricks.run';
	context.subscriptions.push(statusBarItem);

	//Initial status bar update at startup
	updateStatusBarText(statusBarItem);

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
        const workspacePath = workspaceFolders[0].uri.fsPath;
        const robotNameFile = path.join(workspacePath, '.robotName');

        const fileWatcher = fs.watch(robotNameFile, (eventType) => {
            if (eventType === 'change') {
                updateStatusBarText(statusBarItem);
            }
        });

        context.subscriptions.push({
            dispose: () => fileWatcher.close()
        });
    }

	// System Bluetooth command
    context.subscriptions.push(vscode.commands.registerCommand('pybricks.run', () => {

        	// Update robot name dynamically before running
		const robotName = updateStatusBarText(statusBarItem);

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

        let cmd = `pybricksdev run ble "${filePath}"`;
		if (robotName && robotName !== 'LEGO Bricks') {
			cmd = `pybricksdev run ble --name "${robotName}" "${filePath}"`;
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

            
                const vscode = acquireVsCodeApi();

                document.getElementById('runButton').addEventListener('click', async () => {
                    vscode.postMessage({ command: 'requestScript' });
                });

                window.addEventListener('message', async (event) => {
                    const message = event.data;

                    if (message.command === 'sendScript') {
                        const scriptContent = message.content;
                        document.getElementById('output').textContent = "Connecting via Web Bluetooth...";

                        try {
                            const device = await navigator.bluetooth.requestDevice({
                                filters: [{ services: ['battery_service'] }] // Replace with Pybricks service UUID
                            });

                            const server = await device.gatt.connect();

                            // TODO: Implement Pybricks BLE data transfer logic here

                            document.getElementById('output').textContent = "Connected! Implement Pybricks BLE logic here.";
                        } catch (error) {
                            document.getElementById('output').textContent = 'Error: ' + error;
                        }
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
