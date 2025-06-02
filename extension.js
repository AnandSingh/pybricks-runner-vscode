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

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('pybricks.run', function () {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		console.log('pybricks.run command registered!!');
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
            if (robotName) {
                cmd = `pybricksdev run ble --name "${robotName}" "${filePath}"`;
                vscode.window.showInformationMessage(`Programming brick "${robotName}" with ${filePath}`);
            } else {
                // File empty fallback
                cmd = `pybricksdev run ble "${filePath}"`;
                vscode.window.showWarningMessage('.robotName file is empty; using default command.');
            }
        } else {
            // File not found fallback
            cmd = `pybricksdev run ble "${filePath}"`;
            vscode.window.showWarningMessage('.robotName file not found; using default command.');
        }

        const terminal = vscode.window.createTerminal("Pybricks");
        terminal.show();
        terminal.sendText(cmd);
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
