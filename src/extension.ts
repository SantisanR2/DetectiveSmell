// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { parse, createVisitor } from 'java-ast';
import * as fs from 'fs';
import * as path from 'path';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	console.log('DetectiveSmell is now active!');

	const extensionFolder = context.extensionPath;

	const rulesFilePath = path.join(extensionFolder, '/src/rules.json');
	const rulesContent = fs.readFileSync(rulesFilePath, 'utf8');
	const rules = JSON.parse(rulesContent);

	function readJavaFiles(dir: string): {content: string, filePath: string}[] {
		let javaFilesContent: {content: string, filePath: string}[] = [];
		const files = fs.readdirSync(dir);
	  
		for (const file of files) {
			const filePath = path.join(dir, file);
			const stat = fs.statSync(filePath);
	  
			if (stat.isDirectory()) {
				javaFilesContent = javaFilesContent.concat(readJavaFiles(filePath));
			} else if (stat.isFile() && path.extname(file) === '.java') {
				const content = fs.readFileSync(filePath, 'utf8');
				javaFilesContent.push({content, filePath});
			}
		}
	  
		return javaFilesContent;
	}

	interface DetectiveSmellConfig {
		selectedRules: string[];
		selectedProjectType: string;
	}

	const checkJavaRules = (source: string, filePath: string) => {
		let ast = parse(source);
		interface Report {
			[key: string]: {
				name: string;
				description: string;
				example: string;
				message: string;
				level: string;
				line: number;
				path: string;
			}[];
		}

		let report: Report = {
			'Capa de persistencia': [],
			'Capa de lógica': [],
			'Capa de controladores': []
		};
		let visitor = createVisitor({
			visitMethodDeclaration: (node) => {
				for (const rule of rules.rules) {
				if (rule.max_lines && node && node.stop && node.stop.line - node.start.line > rule.max_lines) {
					report[rule.category].push({
						message: `En el método en la línea ${node.start.line} del archivo ${filePath}`,
						level: rule.level,
						name: rule.name,
						description: rule.description,
						example: rule.example,
						line: node.start.line,
						path: filePath
					});
				}
				if (rule.max_parameters) {
					const parameterCount = node.formalParameters().formalParameterList()?.formalParameter().length || 0;
					if (parameterCount > rule.max_parameters) {
					report[rule.category].push({
						message: `En el método en la línea ${node.start.line} del archivo ${filePath}`,
						level: rule.level,
						name: rule.name,
						description: rule.description,
						example: rule.example,
						line: node.start.line,
						path: filePath
					});
					}
				}
				}
				return false;
			},
			defaultResult: () => true,
			aggregateResult: (a, b) => a,
		});
		visitor.visit(ast);
		return report;
	};

	let disposable = vscode.commands.registerCommand('DetectiveSmell.analyzeProyect', function (selectedFolder: vscode.Uri)
	{

		const config = vscode.workspace.getConfiguration('DetectiveSmell');
		const selectedRules = config.get('DetectiveSmell.selectedRules') || [];
		const selectedProjectType = config.get('DetectiveSmell.selectedProjectType');
		console.log('Configuración actual:');
		console.log(selectedRules?.toString() || 'No hay reglas seleccionadas');
		console.log(selectedProjectType?.toString() || 'No hay tipo de proyecto seleccionado');

		if (selectedFolder === undefined)
		{
			return vscode.window.showWarningMessage('Uso: Click derecho en el directorio del proyecto y seleccionar "Analizar Proyecto"');
		}

		let proyecto = selectedFolder.fsPath;
		const javaFilesContent = readJavaFiles(proyecto);

		console.log("Se está analizando el proyecto " + proyecto);

		interface GlobalReport {
			[key: string]: {
				name: string;
				description: string;
				example: string;
				message: string;
				level: string;
				line: number;
				path: string;
			}[];
		}

		let globalReport:GlobalReport = {
			'Capa de persistencia': [],
			'Capa de lógica': [],
			'Capa de controladores': []
		};
	
		for (const javaFileContent of javaFilesContent) {
			const path = javaFileContent.filePath.split(proyecto)[1];
			const fileReport = checkJavaRules(javaFileContent.content, path);
			for (const category in fileReport) {
				globalReport[category] = globalReport[category].concat(fileReport[category]);
			}
		}

		const panel = vscode.window.createWebviewPanel(
			'analysisReport', // Identificador del panel
			'Informe de Análisis del Proyecto', // Título del panel
			vscode.ViewColumn.One, // Muestra el panel en la columna activa
			{} // Opciones de webview
		);

		panel.webview.html = `
			<!DOCTYPE html>
			<html lang="es">
			<head>
			<!DOCTYPE html>
			<html lang="es">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
				<title>Informe de Análisis del Proyecto</title>
				<style>
					body {
						font-family: Arial, sans-serif;
						margin: 20px;
						background-color: #f4f4f4;
					}
					h1 {
						color: #333;
					}
					.card {
						background-color: #fff;
						border-radius: 5px;
						box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
						margin: 20px 0;
						padding: 20px;
					}
					.card h3 {
						margin-top: 0;
					}
					.card p {
						margin: 10px 0;
					}
					.btn-detail {
						background-color: #008CBA; /* Blue */
						border: none;
						color: white;
						padding: 10px 20px;
						text-align: center;
						text-decoration: none;
						display: inline-block;
						font-size: 16px;
						margin: 10px 2px;
						cursor: pointer;
					}
					.severity-leve {
						color: green;
					}
					.severity-moderado {
						color: orange;
					}
					.severity-grave {
						color: red;
					}
					.rule-detail {
						max-height: 0;
						overflow: hidden;
						transition: max-height 0.2s ease-out;
						background: #f1f1f1;
					}
					.rule h3 {
						cursor: pointer;
						font-size: 16px;
						color: #333;
						font-weight: 300;
					}
					.rule-detail p {
						padding: 0 18px;
					}
					.rule:hover {
						background: #ddd;
					}
					.show {
						max-height: 500px;
					}
				</style>
			</head>
			<body>
				<h1>Informe de Análisis del Proyecto</h1>
				<p>Proyecto analizado: ${proyecto}</p>
				<hr>
				<h2>Reglas Violadas:</h2>
				${Object.entries(globalReport).map(([category, rules]) => `
					<div class="card">
						<h3>${category}</h3>
						${rules.map(rule => `
							<div class="rule">
								<h3 onclick="prueba()">${rule.name} en el archivo <a href="#" onclick="openInVSCode(event, '${rule.path}', ${rule.line})">${rule.path.split('\\').at(-1)}</a> <p class="severity-${rule.level.toLowerCase()}">(Severidad: ${rule.level})</p></h3>
								<div class="rule-detail">
									<p>Nombre de la regla: ${rule.name}</p>
									<p>Descripción: ${rule.description}</p>
									<p>Ejemplo de cómo se debe realizar la regla: ${rule.example}</p>
									<p>Mensaje: ${rule.message}</p>
								</div>
							</div>
						`).join('')}
					</div>
				`).join('')}
			</body>
			<script>
				function prueba() {
					console.log('hola');
					alert();
				}

				const vscode = acquireVsCodeApi();
				function openInVSCode(event, path, line) {
					event.preventDefault();
					vscode.postMessage({
						command: 'openFile',
						path: path,
						line: line
					});
				}
			</script>
			</html>
			`;

		panel.webview.onDidReceiveMessage(
			message => {
				if (message.command === 'openFile') {
					const openPath = vscode.Uri.file(message.path);
					vscode.workspace.openTextDocument(openPath).then(doc => {
						vscode.window.showTextDocument(doc, { preview: false, selection: new vscode.Range(new vscode.Position(message.line, 0), new vscode.Position(message.line, 0)) });
					});
				}
			},
			undefined,
			context.subscriptions
		);

		
		let html = `
			<!DOCTYPE html>
			<html lang="es">
			<head>
			<!DOCTYPE html>
			<html lang="es">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>Informe de Análisis del Proyecto</title>
				<style>
					body {
						font-family: Arial, sans-serif;
						margin: 20px;
						background-color: #f4f4f4;
					}
					h1 {
						color: #333;
					}
					.card {
						background-color: #fff;
						border-radius: 5px;
						box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
						margin: 20px 0;
						padding: 20px;
					}
					.card h3 {
						margin-top: 0;
					}
					.card p {
						margin: 10px 0;
					}
					.btn-detail {
						background-color: #008CBA; /* Blue */
						border: none;
						color: white;
						padding: 10px 20px;
						text-align: center;
						text-decoration: none;
						display: inline-block;
						font-size: 16px;
						margin: 10px 2px;
						cursor: pointer;
					}
					.severity-leve {
						color: green;
					}
					.severity-moderado {
						color: orange;
					}
					.severity-grave {
						color: red;
					}
					.rule-detail {
						max-height: 0;
						overflow: hidden;
						transition: max-height 0.2s ease-out;
						background: #f1f1f1;
					}
					.rule h3 {
						cursor: pointer;
						font-size: 16px;
						color: #333;
						font-weight: 300;
					}
					.rule-detail p {
						padding: 0 18px;
					}
					.rule:hover {
						background: #ddd;
					}
					.show {
						max-height: 500px;
					}
				</style>
				<script>
					const vscode = acquireVsCodeApi();
					function openInVSCode(event, path, line) {
						event.preventDefault();
						vscode.postMessage({
							command: 'openFile',
							path: path,
							line: line
						});
					}
				</script>
			</head>
			<body>
				<h1>Informe de Análisis del Proyecto</h1>
				<p>Proyecto analizado: ${proyecto}</p>
				<hr>
				<h2>Reglas Violadas:</h2>
				${Object.entries(globalReport).map(([category, rules]) => `
					<div class="card">
						<h3>${category}</h3>
						${rules.map(rule => `
							<div class="rule">
								<h3 onclick="this.nextElementSibling.classList.toggle('show')">${rule.name} en el archivo <a href="#" onclick="openInVSCode(event, '${rule.path}', ${rule.line})">${rule.path.split('\\').at(-1)}</a> <p class="severity-${rule.level.toLowerCase()}">(Severidad: ${rule.level})</p></h3>
								<div class="rule-detail">
									<p>Nombre de la regla: ${rule.name}</p>
									<p>Descripción: ${rule.description}</p>
									<p>Ejemplo de cómo se debe realizar la regla: ${rule.example}</p>
									<p>Mensaje: ${rule.message}</p>
								</div>
							</div>
						`).join('')}
					</div>
				`).join('')}
			</body>
			</html>
			`;
			const reportHTML = fs.createWriteStream(proyecto + '/report.html');
			let filePath = reportHTML.path.toString();
			filePath = filePath.substring(0, filePath.length - 12);
			filePath += '\\report.html';
			fs.writeFile(filePath, html, function(err) {
				if(err) {
					return console.log(err);
				}
				console.log('El archivo se guardó correctamente en: ' + filePath);
			});

        vscode.window.showInformationMessage('Análisis completado. Ver resultados en report.html');
    });

    context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
