// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// -----------------------------
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

				// Keep your .robotName flow in sync when robotName changes
				if (msg.key === 'robotName') {
					const ws = vscode.workspace.workspaceFolders;
					if (ws?.length) {
						try {
							fs.writeFileSync(path.join(ws[0].uri.fsPath, '.robotName'), (msg.value || '') + '\n');
						} catch (e) {
							vscode.window.showErrorMessage(`Failed to update .robotName: ${e.message}`);
						}
					}
				}
				vscode.window.showInformationMessage('Pybricks setting updated: ' + msg.key);
			}
		});

		const cfg = vscode.workspace.getConfiguration('pybricksRunner');
		//const robotName = cfg.get('robotName') ?? '';
		const autoConn = cfg.get('autoConnectOnStartup') ?? false;
		//const autoRun = cfg.get('autoRunOnSave') ?? false;

		/*<div style="margin:8px 0;">
		    <label>Default Robot</label><br/>
		    <input id="robotName" value="${robotName}" style="width:100%;"/>
		  </div>*/
		//<div><label><input id="autoRunOnSave" type="checkbox" ${autoRun?'checked':''}/> Auto-run on save</label></div>
		// vscode.postMessage({type:'updateSetting', key:'robotName', value:document.getElementById('robotName').value});
		// vscode.postMessage({type:'updateSetting', key:'autoRunOnSave', value:document.getElementById('autoRunOnSave').checked});



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

function readRobotFiles() {
	const ws = vscode.workspace.workspaceFolders;
	let robotName = 'LEGO Bricks';
	let list = [];
	if (ws?.length) {
		const root = ws[0].uri.fsPath;
		const nameFile = path.join(root, '.robotName');
		const listFile = path.join(root, '.robotNameList');
		try { if (fs.existsSync(nameFile)) robotName = fs.readFileSync(nameFile, 'utf8').trim() || robotName; } catch (_) {}
		try {
			if (fs.existsSync(listFile)) {
				list = fs.readFileSync(listFile, 'utf8').split('\n').map(s => s.trim()).filter(Boolean);
			}
		} catch (_) {}
	}
	return { robotName, list };
}

function scanDevicesWithPybricksdev() {
	return new Promise(resolve => {
		exec('pybricksdev devices', { timeout: 4000 }, (err, stdout) => {
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
	const { robotName, list } = readRobotFiles();
	let devices = await scanDevicesWithPybricksdev();

	// Merge in known names from .robotNameList (fallback)
	for (const n of list) {
		if (!devices.find(d => d.name === n)) devices.push({ name: n, connected: false });
	}
	// Ensure .robotName appears at least once
	if (!devices.find(d => d.name === robotName)) {
		devices.unshift({ name: robotName, connected: false });
	}
	// Mark connected flag based on our current session state
	return devices.map(d => ({ ...d, connected: !!currentConnectedName && d.name === currentConnectedName }));
}

// -----------------------------
// ACTIVATE: 

function activate(context) {
	console.log('Extension "pybricks-runner" is now active!'); // original log

	// === Status bar ===
	const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
	statusBarItem.command = 'pybricks.run';
	context.subscriptions.push(statusBarItem);
	updateStatusBarText(statusBarItem);

	let pybricksTerminal;
	const workspaceFolders = vscode.workspace.workspaceFolders;
	if (workspaceFolders && workspaceFolders.length > 0) {
		const workspacePath = workspaceFolders[0].uri.fsPath;
		const robotNameFile = path.join(workspacePath, '.robotName');
		if (fs.existsSync(robotNameFile)) {
			const fileWatcher = fs.watch(robotNameFile, (eventType) => {
				if (eventType === 'change') updateStatusBarText(statusBarItem);
			});
			context.subscriptions.push({ dispose: () => fileWatcher.close() });
		} else {
			console.warn(`.robotName not found — skipping fs.watch setup until user selects a robot.`);
		}
	}

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
			// For now, we "select" the robot and mark it connected in the tree.
			try {
				const ws = vscode.workspace.workspaceFolders;
				if (ws?.length) {
					fs.writeFileSync(path.join(ws[0].uri.fsPath, '.robotName'), (name || '') + '\n');
				}
				currentConnectedName = name || null;
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

	// === ORIGINAL COMMANDS (unchanged) ===
	context.subscriptions.push(vscode.commands.registerCommand('pybricks.run', () => {
		const robotName = updateStatusBarText(statusBarItem);
		const editor = vscode.window.activeTextEditor;
		if (!editor) { vscode.window.showErrorMessage('No active Python file!'); return; }
		const document = editor.document;
		const filePath = document.fileName;
		if (!filePath.endsWith('.py')) { vscode.window.showErrorMessage('Please open a Python (.py) file.'); return; }

		let cmd = `pybricksdev run ble "${filePath}"`;
		if (robotName && robotName !== 'LEGO Bricks') cmd = `pybricksdev run ble --name "${robotName}" "${filePath}"`;

		if (!pybricksTerminal) pybricksTerminal = vscode.window.createTerminal("Pybricks");
		pybricksTerminal.show(true);
		pybricksTerminal.sendText(cmd);

		vscode.window.showInformationMessage(`Programming "${path.basename(filePath)}" to ${robotName}...`);
		logsView.append(`[run] ${path.basename(filePath)} -> ${robotName}`);
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
		if (!robotList.includes('Custom...')) robotList.push('Custom...');

		const selected = await vscode.window.showQuickPick(robotList, { placeHolder: 'Select your LEGO robot name' });
		if (!selected) return;

		let robotName = selected;
		if (selected === 'Custom...') {
			const custom = await vscode.window.showInputBox({ prompt: 'Enter a custom robot name' });
			if (!custom) return;
			robotName = custom.trim();
			if (!robotList.includes(robotName)) {
				try {
					fs.appendFileSync(listFile, robotName + '\n');
					vscode.window.showInformationMessage(`"${robotName}" added to .robotNameList`);
				} catch (err) {
					vscode.window.showErrorMessage(`Failed to update .robotNameList: ${err.message}`);
				}
			}
		}
		try {
			fs.writeFileSync(robotNameFile, robotName + '\n');
			vscode.window.showInformationMessage(`Robot name set to "${robotName}"`);
			currentConnectedName = robotName;
			await vscode.commands.executeCommand('pybricks.refreshDevices');
		} catch (err) {
			vscode.window.showErrorMessage(`Failed to update .robotName: ${err.message}`);
		}
	}));

	// Web Bluetooth runner (original)
	context.subscriptions.push(vscode.commands.registerCommand('pybricks.runWebBluetooth', () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) { vscode.window.showErrorMessage('No active Python file!'); return; }
		const scriptContent = editor.document.getText();

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

	// Initial device list population
	vscode.commands.executeCommand('pybricks.refreshDevices').then(() => {});
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
