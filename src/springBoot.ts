import * as vscode from 'vscode';
import { parse, createVisitor, ClassDeclarationContext, TypeDeclarationContext, AnnotationContext } from 'java-ast';
import * as fs from 'fs';
import * as path from 'path';

export function analyzeSpringBootProject(proyecto: string, rules: any, selectedRules: string[], context: vscode.ExtensionContext) {

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

        let annotationsEntity: any[] = [];
        let annotationsService: any[] = [];

        let visitor = createVisitor({
            visitClassDeclaration: (node) => {
                for (const rule of rules.rules) {
                    if (rule.name === 'Todos los atributos de las entidades son objetos' && selectedRules.includes(rule.name)) {
                        if (node.IDENTIFIER().symbol.text?.includes("Entity")) {
                            let pass = false;
                            for (const nodei of node.classBody().classBodyDeclaration()) {
                                if (nodei.memberDeclaration()?.fieldDeclaration()?.typeType().primitiveType() !== undefined) {
                                    pass = true;
                                }
                            }
                            if (pass) {
                                report[rule.category].push({
                                    message: `En el atributo en la línea ${node.start.line} del archivo ${filePath}`,
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
                }
                return false;
            },
            visitAnnotation: (node) => {
                let clas = node.parent?.parent as TypeDeclarationContext;
                if (clas.classDeclaration()?.IDENTIFIER().symbol.text?.includes("Entity")) {
                    annotationsEntity.push({
                        node: node,
                        classNode: clas,
                        filePath: filePath
                    });
                }
                if (clas.classDeclaration()?.IDENTIFIER().symbol.text?.includes("Service") && !clas.classDeclaration()?.IDENTIFIER().symbol.text?.includes("Test")) {
                    annotationsService.push({
                        node: node,
                        classNode: clas,
                        filePath: filePath
                    });
                }
                return false;
            },
            defaultResult: () => true,
            aggregateResult: (a, b) => a,
        });
        visitor.visit(ast);

        annotationsEntity.reverse();

        for (const annotation of annotationsEntity) {
            for (const rule of rules.rules) {
                if (rule.name === 'Todas las entidades tienen la anotación @Data' && selectedRules.includes(rule.name)) {
                    if (annotation.node.qualifiedName().IDENTIFIER()[0]?.symbol.text?.includes("Data")) {
                        report[rule.category] = report[rule.category].filter(item => item.path !== annotation.filePath || item.line !== annotation.classNode.start.line);
                    } else {
                        report[rule.category].push({
                            message: `En la entidad de la línea ${annotation.classNode.start.line} del archivo ${annotation.filePath}`,
                            level: rule.level,
                            name: rule.name,
                            description: rule.description,
                            example: rule.example,
                            line: annotation.classNode.start.line,
                            path: annotation.filePath
                        });
                    }
                }
            }
        }

        for (const annotation of annotationsService) {
            for (const rule of rules.rules) {
                if (rule.name === 'Todas las clases de lógica tienen la anotación @Service' && selectedRules.includes(rule.name)) {
                    if (annotation.node.qualifiedName().IDENTIFIER()[0]?.symbol.text?.includes("Service")) {
                        report[rule.category] = report[rule.category].filter(item => item.path !== annotation.filePath || item.line !== annotation.classNode.start.line);
                    } else {
                        report[rule.category].push({
                            message: `En la clase de lógica de la línea ${annotation.classNode.start.line} del archivo ${annotation.filePath}`,
                            level: rule.level,
                            name: rule.name,
                            description: rule.description,
                            example: rule.example,
                            line: annotation.classNode.start.line,
                            path: annotation.filePath
                        });
                    }
                }
            }
        }

        return report;
    };
    

    const javaFilesContent = readJavaFiles(proyecto);

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
                    color: #000000;
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
}