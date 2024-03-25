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
exports.analyzeAngular = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const reportPanel_1 = require("./reportPanel");
function analyzeAngular(projectDirectory, context) {
    // Objeto para almacenar la estructura de carpetas y sus archivos
    const folderStructure = {};
    // Array para almacenar los mensajes de error
    const errors = [];
    // Función para leer todos los archivos TypeScript en un directorio y sus subdirectorios
    function readProject(directory, parentFolder = "") {
        fs.readdirSync(directory).forEach(file => {
            const filePath = path.join(directory, file);
            const stats = fs.statSync(filePath);
            if (stats.isDirectory()) {
                // Si es un directorio, leer sus archivos recursivamente
                readProject(filePath, path.join(parentFolder, file));
            }
            else if (file.endsWith(".ts")) {
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
    let globalReport = {
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
    reportPanel_1.Reportpanel.createOrShow(context.extensionUri, projectDirectory, globalReport);
}
exports.analyzeAngular = analyzeAngular;
//# sourceMappingURL=angular.js.map