const vscode = require('vscode');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

let globalState;

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

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

function getPybricksdevCommand(showDebug = false) {
	const homeDir = os.homedir();
	const venvDir = path.join(homeDir, '.pybricks-venv');

	let venvPybricksdev;
	if (process.platform === 'win32') {
		venvPybricksdev = path.join(venvDir, 'Scripts', 'pybricksdev.exe');
	} else {
		venvPybricksdev = path.join(venvDir, 'bin', 'pybricksdev');
	}

	if (showDebug) {
		console.log('[Pybricks Debug] Home dir:', homeDir);
		console.log('[Pybricks Debug] Venv dir:', venvDir);
		console.log('[Pybricks Debug] Looking for:', venvPybricksdev);
		console.log('[Pybricks Debug] File exists:', fs.existsSync(venvPybricksdev));
	}

	if (fs.existsSync(venvPybricksdev)) {
		return `"${venvPybricksdev}"`;
	}

	return 'pybricksdev';
}

// ============================================================================
// SIDEBAR VIEWS
// ============================================================================

class SelectedRobotView {
	resolveWebviewView(view) {
		view.webview.options = { enableScripts: true };
		this.view = view;
		this.refresh();
	}
	refresh() {
		if (!this.view) return;
		const robotName = getRobotName();
		this.view.webview.html = `
		<div style="padding:12px;font-family:var(--vscode-font-family)">
		  <h3 style="margin:0 0 8px;color:var(--vscode-foreground)">🤖 ${robotName}</h3>
		  <p style="margin:0;color:var(--vscode-descriptionForeground);font-size:12px">
		    Currently selected robot
		  </p>
		</div>`;
	}
}

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

// ============================================================================
// DEVICE SCANNING
// ============================================================================

function scanDevicesWithPybricksdev() {
	return new Promise(resolve => {
		const pybricksdevCmd = getPybricksdevCommand();
		exec(`${pybricksdevCmd} devices`, { timeout: 4000 }, (err, stdout) => {
			if (err || !stdout) {
				resolve([]);
				return;
			}
			const names = stdout.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
			resolve([...new Set(names)].map(n => ({ name: n, connected: false })));
		});
	});
}

async function getDeviceListSnapshot(currentConnectedName) {
	const robotName = getRobotName();
	const list = getRobotNameList();
	let devices = await scanDevicesWithPybricksdev();

	// Merge in known names from saved list
	for (const n of list) {
		if (!devices.find(d => d.name === n)) devices.push({ name: n, connected: false });
	}

	// Ensure current robot name appears
	if (robotName && !devices.find(d => d.name === robotName)) {
		devices.unshift({ name: robotName, connected: false });
	}

	// Mark connected
	return devices.map(d => ({ ...d, connected: !!currentConnectedName && d.name === currentConnectedName }));
}

// ============================================================================
// ACTIVATION
// ============================================================================

function activate(context) {
	globalState = context.globalState;

	// Status bar
	const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
	statusBarItem.command = 'pybricks.run';
	statusBarItem.text = '$(rocket) Run on ' + getRobotName();
	statusBarItem.tooltip = 'Run current Python file on robot using pybricksdev';
	statusBarItem.show();
	context.subscriptions.push(statusBarItem);

	let pybricksTerminal;
	let currentConnectedName = null;

	// Sidebar
	const devicesProvider = new DevicesProvider();
	vscode.window.registerTreeDataProvider('pybricks.devices', devicesProvider);

	const selectedRobotView = new SelectedRobotView();
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider('pybricks.selectedRobot', selectedRobotView)
	);

	// Commands
	context.subscriptions.push(
		vscode.commands.registerCommand('pybricks.refreshDevices', async () => {
			const list = await getDeviceListSnapshot(currentConnectedName);
			devicesProvider.refresh(list);
		}),

		vscode.commands.registerCommand('pybricks.connect', async (name) => {
			try {
				await setRobotName(name || 'LEGO Bricks');
				currentConnectedName = name || null;
				statusBarItem.text = '$(rocket) Run on ' + name;
				selectedRobotView.refresh();
				await vscode.commands.executeCommand('pybricks.refreshDevices');
				vscode.window.showInformationMessage(`Selected device: ${name}`);
			} catch (e) {
				vscode.window.showErrorMessage(`Failed to select device: ${e.message}`);
			}
		}),

		vscode.commands.registerCommand('pybricks.disconnect', async () => {
			currentConnectedName = null;
			await vscode.commands.executeCommand('pybricks.refreshDevices');
		}),

		vscode.commands.registerCommand('pybricks.showDebugInfo', async () => {
			const homeDir = os.homedir();
			const venvDir = path.join(homeDir, '.pybricks-venv');
			const venvPybricksdev = path.join(venvDir,
				process.platform === 'win32' ? 'Scripts\\pybricksdev.exe' : 'bin/pybricksdev');

			const venvExists = fs.existsSync(venvDir);
			const pybricksdevExists = fs.existsSync(venvPybricksdev);

			let info = '=== Pybricks Runner Debug Info ===\n\n';
			info += `Platform: ${process.platform}\n`;
			info += `Home Directory: ${homeDir}\n`;
			info += `Venv Directory: ${venvDir}\n`;
			info += `Venv Exists: ${venvExists ? '✓ YES' : '✗ NO'}\n\n`;
			info += `Looking for pybricksdev at:\n${venvPybricksdev}\n`;
			info += `pybricksdev.exe Exists: ${pybricksdevExists ? '✓ YES' : '✗ NO'}\n\n`;

			if (venvExists) {
				info += 'Files in venv:\n';
				try {
					const scriptsDir = path.join(venvDir, process.platform === 'win32' ? 'Scripts' : 'bin');
					if (fs.existsSync(scriptsDir)) {
						const files = fs.readdirSync(scriptsDir);
						info += files.slice(0, 20).join('\n') + '\n';
						if (files.length > 20) info += `... and ${files.length - 20} more files\n`;
					}
				} catch (e) {
					info += `Error reading directory: ${e.message}\n`;
				}
			}

			info += '\n';
			if (!pybricksdevExists) {
				info += '❌ pybricksdev.exe not found!\n\n';
				info += 'Solutions:\n';
				info += '1. Run the installer: installers/install-windows.bat\n';
				info += '2. Or manually: pip install pybricksdev\n';
			} else {
				info += '✓ pybricksdev.exe found!\n';
			}

			const doc = await vscode.workspace.openTextDocument({
				content: info,
				language: 'text'
			});
			await vscode.window.showTextDocument(doc);
		}),

		vscode.commands.registerCommand('pybricks.run', async () => {
			const editor = vscode.window.activeTextEditor;
			if (!editor) {
				vscode.window.showErrorMessage('No active Python file!');
				return;
			}

			const filePath = editor.document.fileName;
			if (!filePath.endsWith('.py')) {
				vscode.window.showErrorMessage('Please open a Python (.py) file.');
				return;
			}

			const robotName = getRobotName();
			const pybricksdevCmd = getPybricksdevCommand();

			if (!pybricksTerminal) {
				pybricksTerminal = vscode.window.createTerminal("Pybricks");
			}
			pybricksTerminal.show(true);

			let cmd = `${pybricksdevCmd} run ble "${filePath}"`;
			if (robotName && robotName !== 'LEGO Bricks') {
				cmd = `${pybricksdevCmd} run ble --name "${robotName}" "${filePath}"`;
			}

			pybricksTerminal.sendText(cmd);
			vscode.window.showInformationMessage(`Programming "${path.basename(filePath)}" to ${robotName}...`);
		}),

		vscode.commands.registerCommand('pybricks.selectRobot', async () => {
			let robotList = getRobotNameList();
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

				if (!robotList.includes(robotName)) {
					robotList.push(robotName);
					await setRobotNameList(robotList);
					vscode.window.showInformationMessage(`"${robotName}" added to robot list`);
				}
			}

			await setRobotName(robotName);
			statusBarItem.text = '$(rocket) Run on ' + robotName;
			currentConnectedName = robotName;
			selectedRobotView.refresh();
			await vscode.commands.executeCommand('pybricks.refreshDevices');
			vscode.window.showInformationMessage(`Robot name set to "${robotName}"`);
		})
	);

	vscode.window.onDidCloseTerminal(terminal => {
		if (terminal.name === 'Pybricks') {
			pybricksTerminal = undefined;
		}
	});

	// Initial device list population
	vscode.commands.executeCommand('pybricks.refreshDevices');

	// Check if pybricksdev is installed
	if (!globalState.get('pybricksdevChecked')) {
		const pybricksdevCmd = getPybricksdevCommand(true);
		exec(`${pybricksdevCmd} --version`, { timeout: 3000 }, (err, stdout) => {
			if (err) {
				const homeDir = os.homedir();
				const venvPath = path.join(homeDir, '.pybricks-venv',
					process.platform === 'win32' ? 'Scripts\\pybricksdev.exe' : 'bin/pybricksdev');

				vscode.window.showWarningMessage(
					'pybricksdev is not installed. Please run the installer.',
					'Run Installer',
					'Show Debug Info',
					'Learn More'
				).then(selection => {
					if (selection === 'Run Installer') {
						const installersPath = path.join(context.extensionPath, 'installers');
						vscode.env.openExternal(vscode.Uri.file(installersPath));
					} else if (selection === 'Show Debug Info') {
						vscode.window.showInformationMessage(
							`Looking for: ${venvPath}\n` +
							`Exists: ${fs.existsSync(venvPath)}\n` +
							`Home: ${homeDir}`,
							'OK'
						);
					} else if (selection === 'Learn More') {
						vscode.env.openExternal(vscode.Uri.parse('https://github.com/pybricks/pybricksdev#installation'));
					}
				});
			} else {
				console.log('[Pybricks] pybricksdev version:', stdout.trim());
			}
			globalState.update('pybricksdevChecked', true);
		});
	}
}

function deactivate() {}

module.exports = { activate, deactivate };
