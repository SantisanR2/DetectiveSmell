import * as fs from "fs";
import * as path from "path";
import * as vscode from 'vscode';
import { Reportpanel } from "../reportPanel";


export function analyzeAngular(projectDirectory: string, context: vscode.ExtensionContext) {
    // Objeto para almacenar la estructura de carpetas y sus archivos
    const folderStructure: { [folderName: string]: string[] } = {};

    // Array para almacenar los mensajes de error
    const errors: string[] = [];

    // Función para leer todos los archivos TypeScript en un directorio y sus subdirectorios
    function readProject(directory: string, parentFolder: string = ""): void {
        fs.readdirSync(directory).forEach(file => {
            const filePath = path.join(directory, file);
            const stats = fs.statSync(filePath);

            if (stats.isDirectory()) {
                // Si es un directorio, leer sus archivos recursivamente
                readProject(filePath, path.join(parentFolder, file));
            } else if (file.endsWith(".ts")) {
                // Si es un archivo TypeScript, agregarlo a la lista
                const folder = parentFolder || "/";
                if (!folderStructure[folder]) {
                    folderStructure[folder] = [];
                }
                folderStructure[folder].push(filePath);
            }
        });
    }

    // Obtener la lista de archivos TypeScript del proyecto y construir la estructura de carpetas
    readProject(projectDirectory);

    // Verificar si los nombres de los archivos contienen el nombre de la carpeta
    for (const folderName in folderStructure) {
        const files = folderStructure[folderName];
        const folderBaseName = path.basename(folderName);
        for (const filename of files) {
            const fileBaseName = path.basename(filename, path.extname(filename));
            if (!fileBaseName.includes(folderBaseName)) {
                errors.push(`El archivo ${filename} no contiene el nombre de la carpeta ${folderBaseName}`);
            }
        }
    }

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

    let globalReport:GlobalReport = {
        'Capa de dominio': [],
        'Capa de infrastructura': [],
        'Capa de módulos ': [],
        'Capa de componentes': []
    };

    //Lena el objeto globalReport con los datos de los archivos solo en la capa de dominio
    //TODO: Gabi, por favor, llena bien este objeto que es el que se muestra en el reporte
    //TODO: id es el id de la regla, name es el nombre de la regla, description es la descripción de la regla, example es un ejemplo de la regla, message es el mensaje de error, level es el nivel de severidad del error, line es la línea del error, path es la ruta del archivo
    //TODO: Recuerda llenarlo para cada capa que encuentres
    for (const error of errors) {
        globalReport['Capa de dominio'].push({
            id: 1,
            name: 'Mala estructura:',
            description: 'El nombre del archivo debe ser el mismo que el nombre de la clase o interfaz que contiene.',
            example: 'archivo: clase.ts, clase: clase',
            message: 'El nombre del archivo no coincide con el nombre de la clase o interfaz que contiene.',
            level: 'Moderado',
            line: 1,
            path: error
        });
    }

    Reportpanel.createOrShow(context.extensionUri, projectDirectory, globalReport);
}