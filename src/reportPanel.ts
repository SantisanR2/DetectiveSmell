import * as vscode from "vscode";

interface GlobalReport {
    [key: string]: {
        id: number;
        name: string;
        description: string;
        example: string;
        message: string;
        level: string;
        line: number;
        path: string;
    }[];
}

export class Reportpanel {

    public static currentPanel: Reportpanel | undefined;

    public static readonly viewType = "Report";

    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];

    public static createOrShow(extensionUri: vscode.Uri, proyecto: string, globalReport: GlobalReport) {

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
        const panel = vscode.window.createWebviewPanel(
        Reportpanel.viewType,
        "Report",
        column || vscode.ViewColumn.One,
        {
            // Enable javascript in the webview
            enableScripts: true,
            enableCommandUris: true,
            
        }
        );

        Reportpanel.currentPanel = new Reportpanel(panel, extensionUri, proyecto, globalReport);
    }

    public static kill() {
        Reportpanel.currentPanel?.dispose();
        Reportpanel.currentPanel = undefined;
    }

    public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, proyecto: string, globalReport: GlobalReport) {
        Reportpanel.currentPanel = new Reportpanel(panel, extensionUri, proyecto, globalReport);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, proyecto: string, globalReport: GlobalReport) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        // Set the webview's initial html content
        this._update(proyecto, globalReport);

        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    }

    public dispose() {
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

private async _update(proyecto: string, globalReport: GlobalReport) {
        const webview = this._panel.webview;

        this._panel.webview.html = this._getHtmlForWebview(webview, proyecto, globalReport);
        webview.onDidReceiveMessage(async (message ) => {
            switch (message.command) {
                case 'openFile':
                    const document = await vscode.workspace.openTextDocument(message.path);
                    vscode.window.showTextDocument(document).then(e => {
                        const range = document.lineAt(message.line-1).range;
                        e.selection = new vscode.Selection(range.start, range.end);
                        e.revealRange(range, vscode.TextEditorRevealType.InCenter);
                    });
            }
        });
    }

    private _getHtmlForWebview(webview: vscode.Webview, proyecto: string, globalReport: GlobalReport) {
        // And the uri we use to load this script in the webview
        const scriptUri = webview.asWebviewUri(
        vscode.Uri.joinPath(this._extensionUri, "report", "main.js")
        );

        // Uri to load styles into webview
        const stylesMainUri = webview.asWebviewUri(
        vscode.Uri.joinPath(this._extensionUri, "report", "vscode.css")
        );

        // Uri to load media into webview
        const circleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, "report", "circulo")
        );


        return `<!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta http-equiv="Content-Security-Policy" content="img-src https: data:; style-src 'unsafe-inline' ${webview.cspSource};">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <link href="${stylesMainUri}" rel="stylesheet">
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
                                    <div class="flexbox" onclick="this.nextElementSibling.classList.toggle('show')">
                                        <div class="flex">
                                            <img src="${circleUri}-${rule.level.toLowerCase()}.png"></img>
                                            <h3>${rule.name} en el archivo <span><b>${rule.path.split('\\').at(-1)}</b></span></h3>
                                        </div>
                                        <button class="btn" onclick="abrirArchivo('${proyecto.replace(/\\/g, '\\\\')}${rule.path.replace(/\\/g, '\\\\')}',${rule.line})"><span>Abrir <svg width="14px" height="14px" viewBox="0 0 15 14" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M13.71 4.29l-3-3L10 1H4L3 2v12l1 1h9l1-1V5l-.29-.71zM13 14H4V2h5v4h4v8zm-3-9V2l3 3h-3z"/></svg></span></button>
                                    </div>
                                    <div class="rule-detail">
                                        <p><b>Nombre de la regla:</b> ${rule.name}</p>
                                        <p><b>Descripción:</b> ${rule.description}</p>
                                        <p><b>Ejemplo:</b><br><div class="cardExample">${rule.example}</div></p>
                                        <p><b>Detalle:</b> ${rule.message}</p>
                                        <p class="severity-${rule.level.toLowerCase()}"><b>Severidad:</b> ${rule.level}</p>
                                    </div>
                                    <hr>
                                </div>
                            `).join('')}
                        </div>
                    `).join('')}
                </body>
                <script src="${scriptUri}" >
                </html>`;
        }
}