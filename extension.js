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
	let pybricksTerminal;

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
        const workspacePath = workspaceFolders[0].uri.fsPath;
        const robotNameFile = path.join(workspacePath, '.robotName');

		if (fs.existsSync(robotNameFile)) {
			const fileWatcher = fs.watch(robotNameFile, (eventType) => {
				if (eventType === 'change') {
					updateStatusBarText(statusBarItem);
				}
			});
			context.subscriptions.push({ dispose: () => fileWatcher.close() });
		} else {
			console.warn(`.robotName not found — skipping fs.watch setup until user selects a robot.`);
		}
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

		if (!pybricksTerminal /*|| pybricksTerminal.exitStatus*/) {
			pybricksTerminal = vscode.window.createTerminal("Pybricks");
		}
		pybricksTerminal.show(true);
		pybricksTerminal.sendText(cmd);

        vscode.window.showInformationMessage(`Programming "${path.basename(filePath)}" to ${robotName}...`);
        
    }));

    vscode.window.onDidCloseTerminal(terminal => {
		if (terminal.name === 'Pybricks') {
			const status = terminal.exitStatus;
			if (status) {
				vscode.window.showInformationMessage(`Pybricks terminal exited with code ${status.code}`);
			} else {
				vscode.window.showInformationMessage('Pybricks terminal closed with unknown status.');
			}
			pybricksTerminal = undefined;
		}
	});


	context.subscriptions.push(vscode.commands.registerCommand('pybricks.selectRobot', async () => {
		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (!workspaceFolders || workspaceFolders.length === 0) {
			vscode.window.showErrorMessage('No workspace folder open.');
			return;
		}

		const workspacePath = workspaceFolders[0].uri.fsPath;
		const listFile = path.join(workspacePath, '.robotNameList');
		const robotNameFile = path.join(workspacePath, '.robotName');

		let robotList = [];
		if (fs.existsSync(listFile)) {
			try {
				const content = fs.readFileSync(listFile, 'utf8');
				robotList = content.split('\n').map(name => name.trim()).filter(name => name);
			} catch (err) {
				console.warn('Could not read .robotNameList:', err.message);
			}
		}

		if (!robotList.includes('Custom...')) {
			robotList.push('Custom...');
		}

		const selected = await vscode.window.showQuickPick(robotList, {
			placeHolder: 'Select your LEGO robot name'
		});
		if (!selected) return;

		let robotName = selected;

		if (selected === 'Custom...') {
			const custom = await vscode.window.showInputBox({
				prompt: 'Enter a custom robot name'
			});
			if (!custom) return;
			robotName = custom.trim();

			// ✅ Add custom name to .robotNameList if not already there
			if (!robotList.includes(robotName)) {
				try {
					fs.appendFileSync(listFile, robotName + '\n');
					vscode.window.showInformationMessage(`"${robotName}" added to .robotNameList`);
				} catch (err) {
					vscode.window.showErrorMessage(`Failed to update .robotNameList: ${err.message}`);
				}
			}
		}

		// ✅ Always update .robotName
		try {
			fs.writeFileSync(robotNameFile, robotName + '\n');
			vscode.window.showInformationMessage(`Robot name set to "${robotName}"`);
		} catch (err) {
			vscode.window.showErrorMessage(`Failed to update .robotName: ${err.message}`);
		}
	}));


    // Web Bluetooth command
    context.subscriptions.push(vscode.commands.registerCommand('pybricks.runWebBluetooth', () => {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		vscode.window.showErrorMessage('No active Python file!');
		return;
	}
	const scriptContent = editor.document.getText();

	// Read robot name from file
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
			console.warn('Could not read .robotName:', err.message);
		}
	}

	const panel = vscode.window.createWebviewPanel(
		'pybricksWebBluetooth',
		'Pybricks Web Bluetooth Runner',
		vscode.ViewColumn.One,
		{ enableScripts: true }
	);

    const fileName = path.basename(editor.document.fileName);

    panel.webview.html = getWebviewContent(robotName, fileName);

    panel.webview.onDidReceiveMessage(
        message => {
            if (message.command === 'requestScript') {
                panel.webview.postMessage({
                    command: 'sendScript',
                    content: scriptContent,
                    robotName: robotName,
                    fileName: fileName
                });
            }
        },
        undefined,
        context.subscriptions
    );
    }));

}

function getWebviewContent(robotName, fileName) {
	return `
		<!DOCTYPE html>
		<html>
		<head>
			<meta charset="UTF-8">
			<title>Run ${fileName} on ${robotName}</title>
		</head>
		<body>
			<h2>Run on ${robotName} 🌐</h2>
			<p><strong>File:</strong> ${fileName}</p>
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
						const script = message.content;
						const robotName = message.robotName;
						const fileName = message.fileName;

						document.getElementById('output').textContent = "📁 " + fileName + "\\n🔍 Scanning for: " + robotName;

						const PYBRICKS_SERVICE = 'c5f50001-8280-46da-89f4-6d8051e4aeef';
						const COMMAND_CHAR = 'c5f50002-8280-46da-89f4-6d8051e4aeef';

						const COMMANDS = {
							STOP_USER_PROGRAM: 0,
							START_USER_PROGRAM: 1,
							WRITE_USER_PROGRAM_META: 3,
							WRITE_USER_RAM: 4
						};

						try {
							const device = await navigator.bluetooth.requestDevice({
								filters: [{ namePrefix: robotName }],
								optionalServices: [PYBRICKS_SERVICE]
							});

							document.getElementById('output').textContent = "🔗 Connecting to " + device.name + "...";
							const server = await device.gatt.connect();
							const service = await server.getPrimaryService(PYBRICKS_SERVICE);
							const char = await service.getCharacteristic(COMMAND_CHAR);

							const encoder = new TextEncoder();
							const programData = encoder.encode(script);
							const programSize = programData.length;
							await char.writeValue(Uint8Array.of(COMMANDS.STOP_USER_PROGRAM));

							const meta = new ArrayBuffer(5);
							const metaView = new DataView(meta);
							metaView.setUint8(0, COMMANDS.WRITE_USER_PROGRAM_META);
							metaView.setUint32(1, programSize, true);
							await char.writeValue(meta);

							const chunkSize = 100;
							for (let offset = 0; offset < programSize; offset += chunkSize) {
								const chunk = programData.slice(offset, offset + chunkSize);
								const buffer = new ArrayBuffer(5 + chunk.length);
								const view = new DataView(buffer);
								view.setUint8(0, COMMANDS.WRITE_USER_RAM);
								view.setUint32(1, offset, true);
								new Uint8Array(buffer, 5).set(chunk);
								await char.writeValue(buffer);
								await new Promise(resolve => setTimeout(resolve, 20));
							}

							await char.writeValue(new Uint8Array([COMMANDS.START_USER_PROGRAM]));

							document.getElementById('output').textContent = "✅ ${fileName} sent and executed on ${robotName}!";
						} catch (error) {
							document.getElementById('output').textContent = "❌ Error: " + error;
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
