// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { analyzeSpringBootProject } from './frameworks/springBoot';
import { analyzeAngular } from './frameworks/angular';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	console.log('DetectiveSmell is now active!');

	const extensionFolder = context.extensionPath;

	const rulesSpringBootFilePath = path.join(extensionFolder, '/src/frameworks/rules/rulesSpringboot.json');
	const rulesSpringBootContent = fs.readFileSync(rulesSpringBootFilePath, 'utf8');
	const rulesSpringBoot = JSON.parse(rulesSpringBootContent);

	let disposable = vscode.commands.registerCommand('DetectiveSmell.analyzeProyect', function (selectedFolder: vscode.Uri)
	{

		 const projectFolder = vscode.workspace.workspaceFolders;

		const config = vscode.workspace.getConfiguration('DetectiveSmell');
		const selectedRulesSpringBoot = config.get('selectedRulesSpringBoot');
		const selectedProjectType = config.get('selectA ProjectType');
		const selectedSeverityRulesSpringBoot = config.get('selectedSeverityRulesSpringBoot');
		const selectedLayerRulesSpringBoot = config.get('selectedLayerRulesSpringBoot');

		if (selectedFolder === undefined)
		{
			return vscode.window.showWarningMessage('Uso: Click derecho en el directorio del proyecto y seleccionar "Analizar Proyecto"');
		}

		let proyecto = projectFolder?.map((folder) => folder.uri.fsPath)[0] || selectedFolder.fsPath;
		
		console.log("Se está analizando el proyecto " + proyecto);

		if (selectedProjectType === 'SpringBoot')
		{
			analyzeSpringBootProject(proyecto, rulesSpringBoot, selectedRulesSpringBoot as string[], selectedSeverityRulesSpringBoot as string[], selectedLayerRulesSpringBoot as string[], context);
		} else if (selectedProjectType === 'NextJS') {
			// Se analiza el proyecto en NextJS
		} else if (selectedProjectType === 'Angular') {
			analyzeAngular(proyecto, context);
		} else {
			vscode.window.showErrorMessage('El tipo de proyecto seleccionado no es válido');
		}

        vscode.window.showInformationMessage('Análisis completado');
    });

    context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
