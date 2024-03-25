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
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const springBoot_1 = require("./frameworks/springBoot");
const angular_1 = require("./frameworks/angular");
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
function activate(context) {
    console.log('DetectiveSmell is now active!');
    const extensionFolder = context.extensionPath;
    const rulesSpringBootFilePath = path.join(extensionFolder, '/src/frameworks/rules/rulesSpringboot.json');
    const rulesSpringBootContent = fs.readFileSync(rulesSpringBootFilePath, 'utf8');
    const rulesSpringBoot = JSON.parse(rulesSpringBootContent);
    let disposable = vscode.commands.registerCommand('DetectiveSmell.analyzeProyect', function (selectedFolder) {
        const projectFolder = vscode.workspace.workspaceFolders;
        const config = vscode.workspace.getConfiguration('DetectiveSmell');
        const selectedRulesSpringBoot = config.get('selectedRulesSpringBoot');
        const selectedProjectType = config.get('selectA ProjectType');
        const selectedSeverityRulesSpringBoot = config.get('selectedSeverityRulesSpringBoot');
        const selectedLayerRulesSpringBoot = config.get('selectedLayerRulesSpringBoot');
        if (selectedFolder === undefined) {
            return vscode.window.showWarningMessage('Uso: Click derecho en el directorio del proyecto y seleccionar "Analizar Proyecto"');
        }
        let proyecto = projectFolder?.map((folder) => folder.uri.fsPath)[0] || selectedFolder.fsPath;
        console.log("Se está analizando el proyecto " + proyecto);
        if (selectedProjectType === 'SpringBoot') {
            (0, springBoot_1.analyzeSpringBootProject)(proyecto, rulesSpringBoot, selectedRulesSpringBoot, selectedSeverityRulesSpringBoot, selectedLayerRulesSpringBoot, context);
        }
        else if (selectedProjectType === 'NextJS') {
            // Se analiza el proyecto en NextJS
        }
        else if (selectedProjectType === 'Angular') {
            (0, angular_1.analyzeAngular)(proyecto, context);
        }
        else {
            vscode.window.showErrorMessage('El tipo de proyecto seleccionado no es válido');
        }
        vscode.window.showInformationMessage('Análisis completado');
    });
    context.subscriptions.push(disposable);
}
exports.activate = activate;
// This method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map