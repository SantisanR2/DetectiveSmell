// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { parse, createVisitor } from 'java-ast';
import * as fs from 'fs';
import * as path from 'path';
import { analyzeSpringBootProject } from './springBoot';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	console.log('DetectiveSmell is now active!');

	const extensionFolder = context.extensionPath;

	const rulesFilePath = path.join(extensionFolder, '/src/rules.json');
	const rulesContent = fs.readFileSync(rulesFilePath, 'utf8');
	const rules = JSON.parse(rulesContent);

	let disposable = vscode.commands.registerCommand('DetectiveSmell.analyzeProyect', function (selectedFolder: vscode.Uri)
	{

		const config = vscode.workspace.getConfiguration('DetectiveSmell');
		const selectedRulesSpringBoot = config.get('selectedRulesSpringBoot');
		const selectedProjectType = config.get('selectedProjectType');

		if (selectedFolder === undefined)
		{
			return vscode.window.showWarningMessage('Uso: Click derecho en el directorio del proyecto y seleccionar "Analizar Proyecto"');
		}

		let proyecto = selectedFolder.fsPath;
		
		console.log("Se está analizando el proyecto " + proyecto);

		if (selectedProjectType === 'SpringBoot')
		{
			analyzeSpringBootProject(proyecto, rules, selectedRulesSpringBoot as string[], context);
		} else if (selectedProjectType === 'NextJS') {
			// Se analiza el proyecto en NextJS
		} else if (selectedProjectType === 'Angular') {
			// Se analiza el proyecto en Angular
		} else {
			vscode.window.showErrorMessage('El tipo de proyecto seleccionado no es válido');
		}

        vscode.window.showInformationMessage('Análisis completado');
    });

    context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
