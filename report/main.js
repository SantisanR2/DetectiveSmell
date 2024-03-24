function abrirArchivo(path, line) {
    const vscode = acquireVsCodeApi();
    // Abre el archivo que se encuentra en el path en el editor
    vscode.postMessage({
        command: 'openFile',
        path: path,
        line: line
    });
}