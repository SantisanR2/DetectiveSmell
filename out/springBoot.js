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
exports.analyzeSpringBootProject = void 0;
const java_ast_1 = require("java-ast");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const reportPanel_1 = require("./reportPanel");
function analyzeSpringBootProject(proyecto, rules, selectedRules, selectedSeverityRules, selectedLayerRulesSpringBoot, context) {
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
        let annotationsEntity = [];
        let annotationsService = [];
        let annotationsController = [];
        let annotationsDTO = [];
        let visitor = (0, java_ast_1.createVisitor)({
            visitClassDeclaration: (node) => {
                for (const rule of rules.rules) {
                    if (rule.id.toString() === '1') {
                        if (node.IDENTIFIER().symbol.text?.includes("Entity") && !node.IDENTIFIER().symbol.text?.includes("Test") && !node.IDENTIFIER().symbol.text?.includes("Exception")) {
                            let pass = false;
                            for (const nodei of node.classBody().classBodyDeclaration()) {
                                if (nodei.memberDeclaration()?.fieldDeclaration()?.typeType().primitiveType() !== undefined) {
                                    pass = true;
                                }
                            }
                            if (pass) {
                                report[rule.category].push({
                                    message: `En la clase en la línea <b>${node.start.line}</b> del archivo ${filePath}`,
                                    level: rule.level,
                                    name: rule.name,
                                    id: rule.id,
                                    description: rule.description,
                                    example: rule.example,
                                    line: node.start.line,
                                    path: filePath
                                });
                            }
                        }
                    }
                    if (rule.id.toString() === '4') {
                        if (node.IDENTIFIER().symbol.text?.includes("Service") && !node.IDENTIFIER().symbol.text?.includes("Test") && !node.IDENTIFIER().symbol.text?.includes("Exception")) {
                            for (const nodei of node.classBody().classBodyDeclaration()) {
                                if (!nodei.modifier()[0]?.classOrInterfaceModifier()?.annotation()?.qualifiedName()?.IDENTIFIER()[0]?.symbol.text?.includes("Autowired") && nodei.memberDeclaration()?.fieldDeclaration() !== undefined) {
                                    report[rule.category].push({
                                        message: `En el atributo en la línea <b>${node.start.line}</b> del archivo ${filePath}`,
                                        level: rule.level,
                                        name: rule.name,
                                        id: rule.id,
                                        description: rule.description,
                                        example: rule.example,
                                        line: node.start.line,
                                        path: filePath
                                    });
                                }
                            }
                        }
                    }
                    if (rule.id.toString() === '7') {
                        if (node.IDENTIFIER().symbol.text?.includes("Controller")) {
                            for (const nodei of node.classBody().classBodyDeclaration()) {
                                if (!nodei.modifier()[0]?.classOrInterfaceModifier()?.annotation()?.qualifiedName()?.IDENTIFIER()[0]?.symbol.text?.includes("Autowired") && nodei.memberDeclaration()?.fieldDeclaration() !== undefined) {
                                    report[rule.category].push({
                                        message: `En el atributo en la línea <b>${node.start.line}</b> del archivo ${filePath}`,
                                        level: rule.level,
                                        name: rule.name,
                                        id: rule.id,
                                        description: rule.description,
                                        example: rule.example,
                                        line: node.start.line,
                                        path: filePath
                                    });
                                }
                            }
                        }
                    }
                    if (rule.id.toString() === '8') {
                        if (node.IDENTIFIER().symbol.text?.includes("DTO")) {
                            if ((node.parent?.childCount ?? 0).toString() === '2') {
                                report[rule.category].push({
                                    message: `En la clase en la línea <b>${node.start.line}</b> del archivo ${filePath}`,
                                    level: rule.level,
                                    name: rule.name,
                                    id: rule.id,
                                    description: rule.description,
                                    example: rule.example,
                                    line: node.start.line,
                                    path: filePath
                                });
                            }
                        }
                    }
                    if (rule.id.toString() === '2') {
                        if (node.IDENTIFIER().symbol.text?.includes("Entity") && !node.IDENTIFIER().symbol.text?.includes("Test") && !node.IDENTIFIER().symbol.text?.includes("Exception")) {
                            if ((node.parent?.childCount ?? 0).toString() === '2') {
                                report[rule.category].push({
                                    message: `En la clase en la línea <b>${node.start.line}</b> del archivo ${filePath}`,
                                    level: rule.level,
                                    name: rule.name,
                                    id: rule.id,
                                    description: rule.description,
                                    example: rule.example,
                                    line: node.start.line,
                                    path: filePath
                                });
                            }
                        }
                    }
                    if (rule.id.toString() === '3') {
                        if (node.IDENTIFIER().symbol.text?.includes("Service") && !node.IDENTIFIER().symbol.text?.includes("Test") && !node.IDENTIFIER().symbol.text?.includes("Exception")) {
                            if ((node.parent?.childCount ?? 0).toString() === '2') {
                                report[rule.category].push({
                                    message: `En la clase en la línea <b>${node.start.line}</b> del archivo ${filePath}`,
                                    level: rule.level,
                                    name: rule.name,
                                    id: rule.id,
                                    description: rule.description,
                                    example: rule.example,
                                    line: node.start.line,
                                    path: filePath
                                });
                            }
                        }
                    }
                    if (rule.id.toString() === '5') {
                        if (node.IDENTIFIER().symbol.text?.includes("Controller")) {
                            if ((node.parent?.childCount ?? 0).toString() === '2') {
                                report[rule.category].push({
                                    message: `En la clase en la línea <b>${node.start.line}</b> del archivo ${filePath}`,
                                    level: rule.level,
                                    name: rule.name,
                                    id: rule.id,
                                    description: rule.description,
                                    example: rule.example,
                                    line: node.start.line,
                                    path: filePath
                                });
                            }
                        }
                    }
                    if (rule.id.toString() === '6') {
                        if (node.IDENTIFIER().symbol.text?.includes("Controller")) {
                            if ((node.parent?.childCount ?? 0).toString() === '2') {
                                report[rule.category].push({
                                    message: `En la clase en la línea <b>${node.start.line}</b> del archivo ${filePath}`,
                                    level: rule.level,
                                    name: rule.name,
                                    id: rule.id,
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
                let clas = node.parent?.parent;
                if (clas.classDeclaration()?.IDENTIFIER().symbol.text?.includes("Entity")) {
                    annotationsEntity.push({
                        node: node,
                        classNode: clas,
                        filePath: filePath
                    });
                }
                if (clas.classDeclaration()?.IDENTIFIER().symbol.text?.includes("Service") && !clas.classDeclaration()?.IDENTIFIER().symbol.text?.includes("Test") && !clas.classDeclaration()?.IDENTIFIER().symbol.text?.includes("Exception")) {
                    annotationsService.push({
                        node: node,
                        classNode: clas,
                        filePath: filePath
                    });
                }
                if (clas.classDeclaration()?.IDENTIFIER().symbol.text?.includes("Controller")) {
                    annotationsController.push({
                        node: node,
                        classNode: clas,
                        filePath: filePath
                    });
                }
                if (clas.classDeclaration()?.IDENTIFIER().text.includes("DTO")) {
                    annotationsDTO.push({
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
        if (selectedRules.includes("Todas las entidades tienen la anotación @Data")) {
            let list = [];
            for (const annotation of annotationsEntity) {
                if (annotation.node.qualifiedName().IDENTIFIER()[0]?.symbol.text?.includes("Data")) {
                    list.push(annotation);
                }
            }
            for (const annotation of annotationsEntity) {
                for (const item of list) {
                    if (annotation.filePath === item.filePath) {
                        annotationsEntity = annotationsEntity.filter(item => item.filePath !== annotation.filePath);
                    }
                }
            }
            for (const annotation of annotationsEntity) {
                for (const rule of rules.rules) {
                    if (rule.id.toString() === '2') {
                        report[rule.category].push({
                            message: `En la entidad de la línea <b>${annotation.classNode.start.line}</b> del archivo ${annotation.filePath}`,
                            level: rule.level,
                            name: rule.name,
                            id: rule.id,
                            description: rule.description,
                            example: rule.example,
                            line: annotation.classNode.start.line,
                            path: annotation.filePath
                        });
                    }
                }
            }
        }
        if (selectedRules.includes("Todas las clases de lógica tienen la anotación @Service")) {
            let list = [];
            for (const annotation of annotationsService) {
                if (annotation.node.qualifiedName().IDENTIFIER()[0]?.symbol.text?.includes("Service")) {
                    list.push(annotation);
                }
            }
            for (const annotation of annotationsService) {
                for (const item of list) {
                    if (annotation.filePath === item.filePath) {
                        annotationsService = annotationsService.filter(item => item.filePath !== annotation.filePath);
                    }
                }
            }
            for (const annotation of annotationsService) {
                for (const rule of rules.rules) {
                    if (rule.id.toString() === '3') {
                        report[rule.category].push({
                            message: `En la clase de lógica de la línea <b>${annotation.classNode.start.line}</b> del archivo ${annotation.filePath}`,
                            level: rule.level,
                            name: rule.name,
                            id: rule.id,
                            description: rule.description,
                            example: rule.example,
                            line: annotation.classNode.start.line,
                            path: annotation.filePath
                        });
                    }
                }
            }
        }
        if (selectedRules.includes("Todas las clases de controladores tienen la anotación @Controller")) {
            let list = [];
            let complete_list = annotationsController;
            for (const annotation of complete_list) {
                if (annotation.node.qualifiedName().IDENTIFIER()[0]?.symbol.text?.includes("Controller")) {
                    list.push(annotation);
                }
            }
            for (const annotation of complete_list) {
                for (const item of list) {
                    if (annotation.filePath === item.filePath) {
                        complete_list = complete_list.filter(item => item.filePath !== annotation.filePath);
                    }
                }
            }
            complete_list = complete_list.filter((elem, index, self) => self.findIndex((t) => { return t.filePath === elem.filePath; }) === index);
            for (const annotation of complete_list) {
                for (const rule of rules.rules) {
                    if (rule.id.toString() === '5') {
                        report[rule.category].push({
                            message: `En la clase de controladores de la línea <b>${annotation.classNode.start.line}</b> del archivo ${annotation.filePath}`,
                            level: rule.level,
                            name: rule.name,
                            id: rule.id,
                            description: rule.description,
                            example: rule.example,
                            line: annotation.classNode.start.line,
                            path: annotation.filePath
                        });
                    }
                }
            }
        }
        if (selectedRules.includes("Todas las clases de controladores tienen la anotación @RequestMapping")) {
            let list = [];
            let complete_list = annotationsController;
            for (const annotation of complete_list) {
                if (annotation.node.qualifiedName().IDENTIFIER()[0]?.symbol.text?.includes("RequestMapping")) {
                    list.push(annotation);
                }
            }
            for (const annotation of complete_list) {
                for (const item of list) {
                    if (annotation.filePath === item.filePath) {
                        complete_list = complete_list.filter(item => item.filePath !== annotation.filePath);
                    }
                }
            }
            complete_list = complete_list.filter((elem, index, self) => self.findIndex((t) => { return t.filePath === elem.filePath; }) === index);
            for (const annotation of complete_list) {
                for (const rule of rules.rules) {
                    if (rule.id.toString() === '6') {
                        report[rule.category].push({
                            message: `En la clase de controladores de la línea <b>${annotation.classNode.start.line}</b> del archivo ${annotation.filePath}`,
                            level: rule.level,
                            name: rule.name,
                            id: rule.id,
                            description: rule.description,
                            example: rule.example,
                            line: annotation.classNode.start.line,
                            path: annotation.filePath
                        });
                    }
                }
            }
        }
        if (selectedRules.includes("Todas las clases DTO y DetailDTO tienen la anotación @Data")) {
            let list = [];
            let complete_list = annotationsDTO;
            for (const annotation of complete_list) {
                if (annotation.node.qualifiedName().IDENTIFIER()[0]?.symbol.text?.includes("Data")) {
                    list.push(annotation);
                }
            }
            for (const annotation of complete_list) {
                for (const item of list) {
                    if (annotation.filePath === item.filePath) {
                        complete_list = complete_list.filter(item => item.filePath !== annotation.filePath);
                    }
                }
            }
            complete_list = complete_list.filter((elem, index, self) => self.findIndex((t) => { return t.filePath === elem.filePath; }) === index);
            for (const annotation of complete_list) {
                for (const rule of rules.rules) {
                    if (rule.id.toString() === '8') {
                        report[rule.category].push({
                            message: `En la clase DTO de la línea <b>${annotation.classNode.start.line}</b> del archivo ${annotation.filePath}`,
                            level: rule.level,
                            name: rule.name,
                            id: rule.id,
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
    // Solo deja las capas seleccionadas en el config
    for (const category in globalReport) {
        if (!selectedLayerRulesSpringBoot.includes(category)) {
            delete globalReport[category];
        }
    }
    // Solo deja las reglas con severidad seleccionada en el config
    for (const category in globalReport) {
        globalReport[category] = globalReport[category].filter(rule => selectedSeverityRules.includes(rule.level));
    }
    // Vuelve selectedRules a un array de int correspondiente al id de la regla 
    let selectedRulesInt = [];
    for (const rule of selectedRules) {
        if (rule === "Todos los atributos de las entidades son objetos") {
            selectedRulesInt.push(1);
        }
        else if (rule === "Todas las entidades tienen la anotación @Data") {
            selectedRulesInt.push(2);
        }
        else if (rule === "Todas las clases de lógica tienen la anotación @Service") {
            selectedRulesInt.push(3);
        }
        else if (rule === "Todos los atributos de las clases de lógica tienen la anotación @Autowired") {
            selectedRulesInt.push(4);
        }
        else if (rule === "Todas las clases de controladores tienen la anotación @Controller") {
            selectedRulesInt.push(5);
        }
        else if (rule === "Todas las clases de controladores tienen la anotación @RequestMapping") {
            selectedRulesInt.push(6);
        }
        else if (rule === "Todos los atributos de las clases de controladores tienen la anotación @Autowired") {
            selectedRulesInt.push(7);
        }
        else if (rule === "Todas las clases DTO y DetailDTO tienen la anotación @Data") {
            selectedRulesInt.push(8);
        }
    }
    // Solo deja las reglas seleccionadas en el config
    for (const category in globalReport) {
        for (const rule of globalReport[category]) {
            var esta = false;
            for (const ruleInt of selectedRulesInt) {
                if (rule.id.toString() === ruleInt.toString()) {
                    esta = true;
                }
            }
            if (!esta) {
                globalReport[category] = globalReport[category].filter(item => item.id !== rule.id);
            }
        }
    }
    // Ordena globalReport por severidad
    for (const category in globalReport) {
        globalReport[category].sort((a, b) => {
            if (a.level === 'Grave' && (b.level === 'Leve' || b.level === 'Moderado')) {
                return -1;
            }
            else if (a.level === 'Leve' && (b.level === 'Grave' || b.level === 'Moderado')) {
                return 1;
            }
            else if (a.level === 'Moderado' && (b.level === 'Grave')) {
                return 1;
            }
            else if (a.level === 'Moderado' && (b.level === 'Leve')) {
                return -1;
            }
            else {
                return 0;
            }
        });
    }
    reportPanel_1.Reportpanel.createOrShow(context.extensionUri, proyecto, globalReport);
}
exports.analyzeSpringBootProject = analyzeSpringBootProject;
//# sourceMappingURL=springBoot.js.map