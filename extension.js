// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// -----------------------------
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

// Global state storage keys
let globalState;

function getRobotName() {
	return globalState.get('selectedRobotName', 'LEGO Bricks');
}

function setRobotName(name) {
	return globalState.update('selectedRobotName', name);
}

function getRobotNameList() {
	return globalState.get('robotNameList', []);
}

function setRobotNameList(list) {
	return globalState.update('robotNameList', list);
}

function getPybricksdevCommand() {
	// Check for pybricksdev in standard venv locations first
	const homeDir = os.homedir();
	const venvDir = path.join(homeDir, '.pybricks-venv');

	let venvPybricksdev;
	if (process.platform === 'win32') {
		venvPybricksdev = path.join(venvDir, 'Scripts', 'pybricksdev.exe');
	} else {
		venvPybricksdev = path.join(venvDir, 'bin', 'pybricksdev');
	}

	// Check if venv pybricksdev exists
	if (fs.existsSync(venvPybricksdev)) {
		return `"${venvPybricksdev}"`;
	}

	// Fallback to system pybricksdev
	return 'pybricksdev';
}

function updateStatusBarText(statusBarItem) {
	const robotName = getRobotName();
	statusBarItem.text = `$(rocket) Run on ${robotName}`;
	statusBarItem.tooltip = `Run current Python file on ${robotName}`;
	statusBarItem.show();
	return robotName;
}

// -----------------------------
// Sidebar view providers

class DeviceItem extends vscode.TreeItem {
	constructor(name, connected) {
		super(name, vscode.TreeItemCollapsibleState.None);
		this.name = name;
		this.connected = connected;
		this.contextValue = connected ? 'connected' : 'disconnected';
		this.description = connected ? 'connected' : 'disconnected';
		this.iconPath = new vscode.ThemeIcon(connected ? 'plug' : 'circle-large-outline');
		if (!connected) {
			this.command = { command: 'pybricks.connect', title: 'Connect', arguments: [name] };
		}
	}
}

class DevicesProvider {
	constructor() {
		this._onDidChangeTreeData = new vscode.EventEmitter();
		this.onDidChangeTreeData = this._onDidChangeTreeData.event;
		this.devices = [];
	}
	refresh(devices) {
		this.devices = devices.map(d => new DeviceItem(d.name, d.connected));
		this._onDidChangeTreeData.fire();
	}
	getTreeItem(e) { return e; }
	getChildren() { return this.devices; }
}

class SettingsView {
	constructor(context) { this.context = context; }
	resolveWebviewView(view) {
		view.webview.options = { enableScripts: true };
		view.webview.onDidReceiveMessage(async msg => {
			if (msg?.type === 'updateSetting') {
				const cfg = vscode.workspace.getConfiguration('pybricksRunner');
				await cfg.update(msg.key, msg.value, vscode.ConfigurationTarget.Global);
				vscode.window.showInformationMessage('Pybricks setting updated: ' + msg.key);
			}
		});

		const cfg = vscode.workspace.getConfiguration('pybricksRunner');
		const autoConn = cfg.get('autoConnectOnStartup') ?? false;

		view.webview.html = /* html */`
		<section style="padding:12px;font-family:var(--vscode-font-family)">
		  <h3 style="margin:0 0 8px">Quick Settings</h3>

		  <div><label><input id="autoConnect" type="checkbox" ${autoConn?'checked':''}/> Auto-connect on startup</label></div>

		  <button id="save" style="margin-top:10px;">Save</button>
		  <script>
		    const vscode = acquireVsCodeApi();
		    document.getElementById('save').onclick = () => {
		      vscode.postMessage({type:'updateSetting', key:'autoConnectOnStartup', value:document.getElementById('autoConnect').checked});
		    };
		  </script>
		</section>`;
	}
}

class LogsView {
	constructor() { this.view = undefined; }
	resolveWebviewView(view) {
		this.view = view;
		view.webview.options = { enableScripts: true };
		view.webview.html = `
		  <div style="padding:12px;font-family:var(--vscode-font-family)">
		    <h3 style="margin:0 0 8px">Logs / Plots</h3>
		    <pre id="out" style="white-space:pre-wrap;"></pre>
		    <script>
		      const out = document.getElementById('out');
		      window.addEventListener('message', e => { out.textContent += e.data + "\\n"; });
		    </script>
		  </div>`;
	}
	append(line) { this.view?.webview.postMessage(line); }
}

// -----------------------------
// NEW: helpers for Devices view

function readRobotData() {
	const robotName = getRobotName();
	const list = getRobotNameList();
	return { robotName, list };
}

function scanDevicesWithPybricksdev() {
	return new Promise(resolve => {
		const pybricksdevCmd = getPybricksdevCommand();
		exec(`${pybricksdevCmd} devices`, { timeout: 4000 }, (err, stdout) => {
			if (err || !stdout) {
				resolve([]);
				return;
			}
			// naive parse: one device name per line
			const names = stdout.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
			resolve([...new Set(names)].map(n => ({ name: n, connected: false })));
		});
	});
}

async function getDeviceListSnapshot(currentConnectedName) {
	const { robotName, list } = readRobotData();
	let devices = await scanDevicesWithPybricksdev();

	// Merge in known names from saved list (fallback)
	for (const n of list) {
		if (!devices.find(d => d.name === n)) devices.push({ name: n, connected: false });
	}
	// Ensure current robot name appears at least once
	if (robotName && !devices.find(d => d.name === robotName)) {
		devices.unshift({ name: robotName, connected: false });
	}
	// Mark connected flag based on our current session state
	return devices.map(d => ({ ...d, connected: !!currentConnectedName && d.name === currentConnectedName }));
}

// -----------------------------
// ACTIVATE:

function activate(context) {
	console.log('Extension "pybricks-runner" is now active!');

	// Initialize global state
	globalState = context.globalState;

	// One-time migration: read from old .robotName/.robotNameList files if they exist
	const workspaceFolders = vscode.workspace.workspaceFolders;
	if (workspaceFolders && workspaceFolders.length > 0 && !globalState.get('migrated')) {
		const workspacePath = workspaceFolders[0].uri.fsPath;
		const robotNameFile = path.join(workspacePath, '.robotName');
		const listFile = path.join(workspacePath, '.robotNameList');

		try {
			if (fs.existsSync(robotNameFile)) {
				const name = fs.readFileSync(robotNameFile, 'utf8').trim();
				if (name) setRobotName(name);
			}
			if (fs.existsSync(listFile)) {
				const list = fs.readFileSync(listFile, 'utf8').split('\n').map(s => s.trim()).filter(Boolean);
				if (list.length > 0) setRobotNameList(list);
			}
			globalState.update('migrated', true);
			console.log('Migrated robot names from workspace files to global state');
		} catch (err) {
			console.warn('Migration failed:', err.message);
		}
	}

	// === Status bar ===
	const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
	statusBarItem.command = 'pybricks.run';
	context.subscriptions.push(statusBarItem);
	updateStatusBarText(statusBarItem);

	let pybricksTerminal;

	// === Sidebar providers ===
	const devicesProvider = new DevicesProvider();
	vscode.window.registerTreeDataProvider('pybricks.devices', devicesProvider);

	const settingsView = new SettingsView(context);
	context.subscriptions.push(vscode.window.registerWebviewViewProvider('pybricks.settings', settingsView));

	const logsView = new LogsView();
	context.subscriptions.push(vscode.window.registerWebviewViewProvider('pybricks.logs', logsView));

	let currentConnectedName = null;

	// === NEW: Commands for views ===
	context.subscriptions.push(
		vscode.commands.registerCommand('pybricks.refreshDevices', async () => {
			const list = await getDeviceListSnapshot(currentConnectedName);
			devicesProvider.refresh(list);
		}),

		vscode.commands.registerCommand('pybricks.connect', async (name) => {
			// Select the robot and mark it connected in the tree
			try {
				await setRobotName(name || 'LEGO Bricks');
				currentConnectedName = name || null;
				updateStatusBarText(statusBarItem);
				await vscode.commands.executeCommand('pybricks.refreshDevices');
				logsView.append(`[info] Selected device "${name}". Will use it for Run.`);
				vscode.window.showInformationMessage(`Selected device: ${name}`);
			} catch (e) {
				vscode.window.showErrorMessage(`Failed to select device: ${e.message}`);
			}
		}),

		vscode.commands.registerCommand('pybricks.disconnect', async () => {
			currentConnectedName = null;
			await vscode.commands.executeCommand('pybricks.refreshDevices');
			logsView.append('[info] Disconnected.');
		}),

		vscode.commands.registerCommand('pybricks.openSettings', async () => {
			await vscode.commands.executeCommand('workbench.view.extension.pybricksRunner');
		})
	);

	// === ORIGINAL COMMANDS (with remote workspace support) ===
	context.subscriptions.push(vscode.commands.registerCommand('pybricks.run', async () => {
		const robotName = updateStatusBarText(statusBarItem);
		const editor = vscode.window.activeTextEditor;
		if (!editor) { vscode.window.showErrorMessage('No active Python file!'); return; }
		const document = editor.document;
		const originalFilePath = document.fileName;
		if (!originalFilePath.endsWith('.py')) { vscode.window.showErrorMessage('Please open a Python (.py) file.'); return; }

		let filePath = originalFilePath;
		const isRemote = vscode.env.remoteName !== undefined;

		// If workspace is remote, sync workspace files to local temp directory
		if (isRemote) {
			try {
				const workspaceFolders = vscode.workspace.workspaceFolders;
				if (!workspaceFolders || workspaceFolders.length === 0) {
					vscode.window.showErrorMessage('No workspace folder open.');
					return;
				}

				const workspaceRoot = workspaceFolders[0].uri;
				const workspacePath = workspaceRoot.fsPath;
				const tempDir = path.join(os.tmpdir(), 'pybricks-runner', path.basename(workspacePath));

				// Create temp directory if it doesn't exist
				if (!fs.existsSync(tempDir)) {
					fs.mkdirSync(tempDir, { recursive: true });
				}

				logsView.append(`[remote] Syncing workspace files to local temp directory...`);

				// Find all .py files in the workspace
				const pythonFiles = await vscode.workspace.findFiles('**/*.py', '**/.*');

				// Copy all Python files while maintaining directory structure
				for (const fileUri of pythonFiles) {
					const relativePath = path.relative(workspacePath, fileUri.fsPath);
					const targetPath = path.join(tempDir, relativePath);
					const targetDir = path.dirname(targetPath);

					// Create directory if it doesn't exist
					if (!fs.existsSync(targetDir)) {
						fs.mkdirSync(targetDir, { recursive: true });
					}

					// Read file content from remote workspace
					const fileContent = await vscode.workspace.fs.readFile(fileUri);
					fs.writeFileSync(targetPath, fileContent);
				}

				// Calculate the local path for the current file
				const relativeFilePath = path.relative(workspacePath, originalFilePath);
				filePath = path.join(tempDir, relativeFilePath);

				logsView.append(`[remote] Synced ${pythonFiles.length} Python file(s)`);
				logsView.append(`[info] Running pybricksdev locally on ${robotName}...`);
			} catch (err) {
				vscode.window.showErrorMessage(`Failed to sync files from remote workspace: ${err.message}`);
				logsView.append(`[error] ${err.message}`);
				return;
			}
		}

		// Get pybricksdev command (checks venv first)
		const pybricksdevCmd = getPybricksdevCommand();

		// Determine working directory and file path for command
		let filePathForCommand;
		let workingDirectory;

		if (isRemote) {
			// For remote workspaces, use relative path from workspace root
			const workspaceFolders = vscode.workspace.workspaceFolders;
			const workspacePath = workspaceFolders[0].uri.fsPath;
			const tempWorkspaceDir = path.join(os.tmpdir(), 'pybricks-runner', path.basename(workspacePath));

			filePathForCommand = path.relative(workspacePath, originalFilePath);
			workingDirectory = tempWorkspaceDir;
		} else {
			// For local workspaces, use full path
			filePathForCommand = filePath;
			workingDirectory = process.cwd();
		}

		let cmd = `${pybricksdevCmd} run ble "${filePathForCommand}"`;
		if (robotName && robotName !== 'LEGO Bricks') cmd = `${pybricksdevCmd} run ble --name "${robotName}" "${filePathForCommand}"`;

		// For remote workspaces, execute locally using exec() instead of terminal
		// This ensures the command runs on the local machine where Bluetooth is available
		if (isRemote) {
			vscode.window.showInformationMessage(`Programming "${path.basename(originalFilePath)}" to ${robotName}...`);
			logsView.append(`[exec] ${cmd}`);
			logsView.append(`[cwd] ${workingDirectory}`);

			// Set working directory to the temp workspace root so imports work correctly
			const execOptions = {
				timeout: 60000,
				cwd: workingDirectory
			};

			exec(cmd, execOptions, (err, stdout, stderr) => {
				if (stdout) {
					logsView.append(stdout);
					console.log(stdout);
				}
				if (stderr) {
					logsView.append('[stderr] ' + stderr);
					console.error(stderr);
				}
				if (err) {
					// Check if it's a "command not found" error
					if (err.message.includes('command not found') || err.message.includes('not recognized')) {
						const installMsg = 'pybricksdev is not installed on your local machine. Click "Install Guide" for instructions.';
						vscode.window.showErrorMessage(installMsg, 'Install Guide', 'Dismiss').then(selection => {
							if (selection === 'Install Guide') {
								vscode.env.openExternal(vscode.Uri.parse('https://github.com/pybricks/pybricksdev#installation'));
							}
						});
						logsView.append('[error] pybricksdev not found. Please install it locally: pip install pybricksdev');
					} else {
						vscode.window.showErrorMessage(`Error running pybricksdev: ${err.message}`);
						logsView.append(`[error] ${err.message}`);
					}
				} else {
					vscode.window.showInformationMessage(`Successfully programmed ${robotName}!`);
					logsView.append('[success] Program uploaded and executed.');
				}
			});
		} else {
			// For local workspaces, use terminal (original behavior)
			if (!pybricksTerminal) pybricksTerminal = vscode.window.createTerminal("Pybricks");
			pybricksTerminal.show(true);
			pybricksTerminal.sendText(cmd);

			vscode.window.showInformationMessage(`Programming "${path.basename(originalFilePath)}" to ${robotName}...`);
			logsView.append(`[run] ${path.basename(originalFilePath)} -> ${robotName}`);
		}
	}));

	vscode.window.onDidCloseTerminal(terminal => {
		if (terminal.name === 'Pybricks') {
			const status = terminal.exitStatus;
			if (status) vscode.window.showInformationMessage(`Pybricks terminal exited with code ${status.code}`);
			else vscode.window.showInformationMessage('Pybricks terminal closed with unknown status.');
			pybricksTerminal = undefined;
		}
	});

	context.subscriptions.push(vscode.commands.registerCommand('pybricks.selectRobot', async () => {
		// Get existing robot list from global state
		let robotList = getRobotNameList();

		// Always add "Custom..." option at the end
		const options = [...robotList, 'Custom...'];

		const selected = await vscode.window.showQuickPick(options, {
			placeHolder: 'Select your LEGO robot name or choose Custom to add a new one'
		});
		if (!selected) return;

		let robotName = selected;
		if (selected === 'Custom...') {
			const custom = await vscode.window.showInputBox({
				prompt: 'Enter a custom robot name',
				placeHolder: 'e.g., SPIKE Prime, EV3, MyRobot'
			});
			if (!custom) return;
			robotName = custom.trim();

			// Add to list if not already present
			if (!robotList.includes(robotName)) {
				robotList.push(robotName);
				await setRobotNameList(robotList);
				vscode.window.showInformationMessage(`"${robotName}" added to robot list`);
			}
		}

		// Set the selected robot as current
		await setRobotName(robotName);
		updateStatusBarText(statusBarItem);
		currentConnectedName = robotName;
		await vscode.commands.executeCommand('pybricks.refreshDevices');
		vscode.window.showInformationMessage(`Robot name set to "${robotName}"`);
	}));

	// Web Bluetooth runner (original)
	context.subscriptions.push(vscode.commands.registerCommand('pybricks.runWebBluetooth', () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) { vscode.window.showErrorMessage('No active Python file!'); return; }
		const scriptContent = editor.document.getText();

		const robotName = getRobotName();

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

	// Initial device list population
	vscode.commands.executeCommand('pybricks.refreshDevices').then(() => {});

	// Check if pybricksdev is installed (only show warning once)
	if (!globalState.get('pybricksdevChecked')) {
		const pybricksdevCmd = getPybricksdevCommand();
		exec(`${pybricksdevCmd} --version`, { timeout: 3000 }, (err) => {
			if (err) {
				const msg = 'pybricksdev is not installed. Click "Easy Install" to run the installer, or "Manual Install" for instructions.';
				vscode.window.showWarningMessage(msg, 'Easy Install', 'Manual Install', 'Dismiss').then(selection => {
					if (selection === 'Easy Install') {
						// Open the installers folder in file explorer
						const installersPath = path.join(context.extensionPath, 'installers');
						vscode.env.openExternal(vscode.Uri.file(installersPath));
						vscode.window.showInformationMessage(
							process.platform === 'win32'
								? 'Double-click "install-windows.bat" to install pybricksdev'
								: 'Double-click "install-macos.command" to install pybricksdev'
						);
					} else if (selection === 'Manual Install') {
						vscode.env.openExternal(vscode.Uri.parse('https://github.com/pybricks/pybricksdev#installation'));
					}
				});
			}
			globalState.update('pybricksdevChecked', true);
		});
	}
}

// (original)
function getWebviewContent(robotName, fileName) {
	return `
	<!DOCTYPE html>
	<html>
	<head><meta charset="UTF-8"><title>Run ${fileName} on ${robotName}</title></head>
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
	        const COMMANDS = { STOP_USER_PROGRAM:0, START_USER_PROGRAM:1, WRITE_USER_PROGRAM_META:3, WRITE_USER_RAM:4 };
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
	</body></html>`;
}

// (original)
function deactivate() {}

module.exports = { activate, deactivate };
