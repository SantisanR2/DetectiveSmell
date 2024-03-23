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
const vscode = __importStar(require("vscode"));
const java_ast_1 = require("java-ast");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const reportPanel_1 = require("./reportPanel");
function analyzeSpringBootProject(proyecto, rules, selectedRules, context) {
    let ast = (0, java_ast_1.parse)(`
    package co.edu.uniandes.dse.ligaajedrez.services;

    import java.util.List;
    import java.util.Optional;

    @Slf4j
    @Service
    public class AdministratorLeagueService {
        @Autowired
        private LeagueRepository leagueRepository;
        
        @santisanrr
        private AdministratorRepository administratorRepository;

        @Transactional
        public List<League> getLeagues() {
            return leagueRepository.findAll();
        }
    }
    `);
    //console.log(ast);
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
                    if (rule.name === 'Todos los atributos de las entidades son objetos' && selectedRules.includes(rule.name)) {
                        if (node.IDENTIFIER().symbol.text?.includes("Entity") && !node.IDENTIFIER().symbol.text?.includes("Test") && !node.IDENTIFIER().symbol.text?.includes("Exception")) {
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
                    if (rule.name === 'Todos los atributos de las clases de lógica tienen la anotación @Autowired' && selectedRules.includes(rule.name)) {
                        if (node.IDENTIFIER().symbol.text?.includes("Service") && !node.IDENTIFIER().symbol.text?.includes("Test") && !node.IDENTIFIER().symbol.text?.includes("Exception")) {
                            for (const nodei of node.classBody().classBodyDeclaration()) {
                                if (!nodei.modifier()[0]?.classOrInterfaceModifier()?.annotation()?.qualifiedName()?.IDENTIFIER()[0]?.symbol.text?.includes("Autowired") && nodei.memberDeclaration()?.fieldDeclaration() !== undefined) {
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
                    if (rule.name === 'Todos los atributos de las clases de controladores tienen la anotación @Autowired' && selectedRules.includes(rule.name)) {
                        if (node.IDENTIFIER().symbol.text?.includes("Controller")) {
                            for (const nodei of node.classBody().classBodyDeclaration()) {
                                if (!nodei.modifier()[0]?.classOrInterfaceModifier()?.annotation()?.qualifiedName()?.IDENTIFIER()[0]?.symbol.text?.includes("Autowired") && nodei.memberDeclaration()?.fieldDeclaration() !== undefined) {
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
                if (clas.classDeclaration()?.IDENTIFIER().symbol.text?.includes("DTO")) {
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
                    if (rule.name === 'Todas las entidades tienen la anotación @Data') {
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
                    if (rule.name === 'Todas las clases de lógica tienen la anotación @Service') {
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
                    if (rule.name === 'Todas las clases de controladores tienen la anotación @Controller') {
                        report[rule.category].push({
                            message: `En la clase de controladores de la línea ${annotation.classNode.start.line} del archivo ${annotation.filePath}`,
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
                    if (rule.name === 'Todas las clases de controladores tienen la anotación @RequestMapping') {
                        report[rule.category].push({
                            message: `En la clase de controladores de la línea ${annotation.classNode.start.line} del archivo ${annotation.filePath}`,
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
                    if (rule.name === 'Todas las clases DTO y DetailDTO tienen la anotación @Data') {
                        report[rule.category].push({
                            message: `En la clase DTO de la línea ${annotation.classNode.start.line} del archivo ${annotation.filePath}`,
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
    const panel = vscode.window.createWebviewPanel('analysisReport', // Identificador del panel
    'Informe de Análisis del Proyecto', // Título del panel
    vscode.ViewColumn.One, // Muestra el panel en la columna activa
    {} // Opciones de webview
    );
    reportPanel_1.Reportpanel.createOrShow(context.extensionUri, proyecto, globalReport);
}
exports.analyzeSpringBootProject = analyzeSpringBootProject;
//# sourceMappingURL=springBoot.js.map