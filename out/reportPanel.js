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
exports.Reportpanel = void 0;
const vscode = __importStar(require("vscode"));
class Reportpanel {
    static currentPanel;
    static viewType = "Report";
    _panel;
    _extensionUri;
    _disposables = [];
    static createOrShow(extensionUri, proyecto, globalReport) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;
        // If we already have a panel, show it.
        if (Reportpanel.currentPanel) {
            Reportpanel.currentPanel._panel.reveal(column);
            Reportpanel.currentPanel._update(proyecto, globalReport);
            return;
        }
        // Otherwise, create a new panel.
        const panel = vscode.window.createWebviewPanel(Reportpanel.viewType, "Report", column || vscode.ViewColumn.One, {
            // Enable javascript in the webview
            enableScripts: true,
            // And restrict the webview to only loading content from our extension's `report` directory.
            localResourceRoots: [
                vscode.Uri.joinPath(extensionUri, "report"),
            ],
        });
        Reportpanel.currentPanel = new Reportpanel(panel, extensionUri, proyecto, globalReport);
    }
    static kill() {
        Reportpanel.currentPanel?.dispose();
        Reportpanel.currentPanel = undefined;
    }
    static revive(panel, extensionUri, proyecto, globalReport) {
        Reportpanel.currentPanel = new Reportpanel(panel, extensionUri, proyecto, globalReport);
    }
    constructor(panel, extensionUri, proyecto, globalReport) {
        this._panel = panel;
        this._extensionUri = extensionUri;
        // Set the webview's initial html content
        this._update(proyecto, globalReport);
        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    }
    dispose() {
        Reportpanel.currentPanel = undefined;
        // Clean up our resources
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
    async _update(proyecto, globalReport) {
        const webview = this._panel.webview;
        this._panel.webview.html = this._getHtmlForWebview(webview, proyecto, globalReport);
        webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case "onInfo": {
                    if (!data.value) {
                        return;
                    }
                    vscode.window.showInformationMessage(data.value);
                    break;
                }
                case "onError": {
                    if (!data.value) {
                        return;
                    }
                    vscode.window.showErrorMessage(data.value);
                    break;
                }
            }
        });
    }
    _getHtmlForWebview(webview, proyecto, globalReport) {
        // And the uri we use to load this script in the webview
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "report", "main.js"));
        // Uri to load styles into webview
        const stylesMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "report", "vscode.css"));
        return `<!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta http-equiv="Content-Security-Policy" content="img-src https: data:; style-src 'unsafe-inline' ${webview.cspSource};">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <link href="${stylesMainUri}" rel="stylesheet">
                    <script>
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
                <script src="${scriptUri}" >
                </html>`;
    }
}
exports.Reportpanel = Reportpanel;
//# sourceMappingURL=reportPanel.js.map