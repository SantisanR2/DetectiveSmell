import * as vscode from 'vscode';
import { parse, createVisitor, TypeDeclarationContext } from 'java-ast';
import * as fs from 'fs';
import * as path from 'path';
import { Reportpanel } from './reportPanel';

export function analyzeSpringBootProject(proyecto: string, rules: any, selectedRules: string[], selectedSeverityRules: string[], selectedLayerRulesSpringBoot: string[], context: vscode.ExtensionContext) {

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
        let annotationsController: any[] = [];
        let annotationsDTO: any[] = [];

        let visitor = createVisitor({
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
                                    message: `En el atributo en la línea <b>${node.start.line}</b> del archivo ${filePath}`,
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
                    if(rule.name === 'Todos los atributos de las clases de lógica tienen la anotación @Autowired' && selectedRules.includes(rule.name)) {
                        if (node.IDENTIFIER().symbol.text?.includes("Service") && !node.IDENTIFIER().symbol.text?.includes("Test") && !node.IDENTIFIER().symbol.text?.includes("Exception")) {
                            for (const nodei of node.classBody().classBodyDeclaration()) {
                                if(!nodei.modifier()[0]?.classOrInterfaceModifier()?.annotation()?.qualifiedName()?.IDENTIFIER()[0]?.symbol.text?.includes("Autowired") && nodei.memberDeclaration()?.fieldDeclaration() !== undefined) {
                                    report[rule.category].push({
                                        message: `En el atributo en la línea <b>${node.start.line}</b> del archivo ${filePath}`,
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
                    if(rule.name === 'Todos los atributos de las clases de controladores tienen la anotación @Autowired' && selectedRules.includes(rule.name)) {
                        if (node.IDENTIFIER().symbol.text?.includes("Controller")) {
                            for (const nodei of node.classBody().classBodyDeclaration()) {
                                if(!nodei.modifier()[0]?.classOrInterfaceModifier()?.annotation()?.qualifiedName()?.IDENTIFIER()[0]?.symbol.text?.includes("Autowired") && nodei.memberDeclaration()?.fieldDeclaration() !== undefined) {
                                    report[rule.category].push({
                                        message: `En el atributo en la línea <b>${node.start.line}</b> del archivo ${filePath}`,
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
                let clas = node.parent?.parent as TypeDeclarationContext;
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
            let list : any[] = [];

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
                            message: `En la entidad de la línea <b>${annotation.classNode.start.line}</b> del archivo ${annotation.filePath}`,
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
            let list : any[] = [];

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
                            message: `En la clase de lógica de la línea <b>${annotation.classNode.start.line}</b> del archivo ${annotation.filePath}`,
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
            let list : any[] = [];
            let complete_list : any[] = annotationsController;

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
            
            complete_list = complete_list.filter((elem, index, self) => self.findIndex((t) => {return t.filePath === elem.filePath; }) === index);

            for (const annotation of complete_list) {
                for (const rule of rules.rules) {
                    if (rule.name === 'Todas las clases de controladores tienen la anotación @Controller') {
                        report[rule.category].push({
                            message: `En la clase de controladores de la línea <b>${annotation.classNode.start.line}</b> del archivo ${annotation.filePath}`,
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

        if(selectedRules.includes("Todas las clases de controladores tienen la anotación @RequestMapping")) {
            let list : any[] = [];
            let complete_list : any[] = annotationsController;

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

            complete_list = complete_list.filter((elem, index, self) => self.findIndex((t) => {return t.filePath === elem.filePath; }) === index);

            for (const annotation of complete_list) {
                for (const rule of rules.rules) {
                    if (rule.name === 'Todas las clases de controladores tienen la anotación @RequestMapping') {
                        report[rule.category].push({
                            message: `En la clase de controladores de la línea <b>${annotation.classNode.start.line}</b> del archivo ${annotation.filePath}`,
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

        if(selectedRules.includes("Todas las clases DTO y DetailDTO tienen la anotación @Data")) {
            let list : any[] = [];
            let complete_list : any[] = annotationsDTO;

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
            complete_list = complete_list.filter((elem, index, self) => self.findIndex((t) => {return t.filePath === elem.filePath; }) === index);
            for (const annotation of complete_list) {
                for (const rule of rules.rules) {
                    if (rule.name === 'Todas las clases DTO y DetailDTO tienen la anotación @Data') {
                        report[rule.category].push({
                            message: `En la clase DTO de la línea <b>${annotation.classNode.start.line}</b> del archivo ${annotation.filePath}`,
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

    // Ordena globalReport por severidad
    for (const category in globalReport) {
        globalReport[category].sort((a, b) => {
            if (a.level === 'Grave' && (b.level === 'Leve' || b.level === 'Moderado')) {
                return -1;
            } else if (a.level === 'Leve' && (b.level === 'Grave' || b.level === 'Moderado')) {
                return 1;
            } else if (a.level === 'Moderado' && (b.level === 'Grave')) {
                return 1;
            } else if (a.level === 'Moderado' && (b.level === 'Leve')) {
                return -1;
            }
            else {
                return 0;
            }
        });
    }
    
    Reportpanel.createOrShow(context.extensionUri, proyecto, globalReport);
}