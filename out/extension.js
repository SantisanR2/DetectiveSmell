"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = __importStar(require("vscode"));
const java_ast_1 = require("java-ast");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
function activate(context) {
    console.log('DetectiveSmell is now active!');
    const extensionFolder = context.extensionPath;
    const rulesFilePath = path.join(extensionFolder, '/src/rules.json');
    const rulesContent = fs.readFileSync(rulesFilePath, 'utf8');
    const rules = JSON.parse(rulesContent);
    function readJavaFiles(dir) {
        let javaFilesContent = [];
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
                javaFilesContent = javaFilesContent.concat(readJavaFiles(filePath));
            }
            else if (stat.isFile() && path.extname(file) === '.java') {
                const content = fs.readFileSync(filePath, 'utf8');
                javaFilesContent.push({ content, filePath });
            }
        }
        return javaFilesContent;
    }
    const checkJavaRules = (source, filePath) => {
        let ast = (0, java_ast_1.parse)(source);
        let report = {
            'Capa de persistencia': [],
            'Capa de lógica': [],
            'Capa de controladores': []
        };
        let visitor = (0, java_ast_1.createVisitor)({
            visitMethodDeclaration: (node) => {
                for (const rule of rules.rules) {
                    if (rule.max_lines && node && node.stop && node.stop.line - node.start.line > rule.max_lines) {
                        report[rule.category].push({
                            message: `El método en la línea ${node.start.line} del archivo ${filePath} tiene más de ${rule.max_lines} líneas.`,
                            level: rule.level
                        });
                    }
                    if (rule.max_parameters) {
                        const parameterCount = node.formalParameters().formalParameterList()?.formalParameter().length || 0;
                        if (parameterCount > rule.max_parameters) {
                            report[rule.category].push({
                                message: `El método en la línea ${node.start.line} del archivo ${filePath} tiene más de ${rule.max_parameters} parámetros.`,
                                level: rule.level
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
    let disposable = vscode.commands.registerCommand('DetectiveSmell.analyzeFolder', function (selectedFolder) {
        if (selectedFolder === undefined) {
            return vscode.window.showWarningMessage('Uso: Click derecho en el directorio del proyecto y seleccionar "Analizar Proyecto"');
        }
        let proyecto = selectedFolder.fsPath;
        const javaFilesContent = readJavaFiles(proyecto);
        console.log("Se está analizando el proyecto " + proyecto);
        let globalReport = {
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
        let report = '';
        for (const category in globalReport) {
            report += `<h3>${category}</h3>`;
            for (const rule of globalReport[category]) {
                report += `<p>${rule.message} (Severidad: ${rule.level}) <a href="#" onclick="alert('Acá puede ir el detalle de la regla')">Ver detalle</a></p>`;
            }
        }
        const htmlContent = `
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
						<p>${rule.message} <p class="severity-${rule.level.toLowerCase()}">(Severidad: ${rule.level})</p> <button class="btn-detail" onclick="alert('Acá puede ir el detalle de la regla')">Ver detalle</button></p>
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
        fs.writeFile(filePath, htmlContent, function (err) {
            if (err) {
                return console.log(err);
            }
            console.log('El archivo se guardó correctamente en: ' + filePath);
        });
        vscode.window.showInformationMessage('Análisis completado. Ver resultados en report.html');
    });
    context.subscriptions.push(disposable);
}
exports.activate = activate;
// This method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map