import { join } from 'path'
import {
    ClassDeclaration,
    MethodDeclaration,
    Project,
    SourceFile,
} from 'ts-morph'

export interface ExtractedController {
    name: string
    filePath: string
    basePath?: string
    methods: ExtractedMethod[]
}

export interface ExtractedMethod {
    name: string
    parameters: ExtractedParameter[]
    returnType: string
    decorators: string[]
    isPublic: boolean
}

export interface ExtractedParameter {
    name: string
    type: string
    optional: boolean
    decorator?: string
}

export class ControllerExtractor {
    private project: Project

    constructor(projectPath: string) {
        this.project = new Project({
            tsConfigFilePath: join(projectPath, 'tsconfig.json'),
        })
    }

    extractControllers(): ExtractedController[] {
        const controllers: ExtractedController[] = []
        const sourceFiles = this.project.getSourceFiles()

        for (const sourceFile of sourceFiles) {
            // Skip node_modules and test files
            if (
                sourceFile.getFilePath().includes('node_modules') ||
                sourceFile.getFilePath().includes('.spec.') ||
                sourceFile.getFilePath().includes('.test.')
            ) {
                continue
            }

            const classes = sourceFile.getClasses()
            for (const classDecl of classes) {
                // Check if this class is a controller
                if (this.isController(classDecl)) {
                    controllers.push(
                        this.extractController(classDecl, sourceFile)
                    )
                }
            }
        }

        return controllers
    }

    private isController(classDecl: ClassDeclaration): boolean {
        // Check if class has @Controller decorator
        const decorators = classDecl.getDecorators()
        return decorators.some(
            (decorator) => decorator.getName() === 'Controller'
        )
    }

    private extractController(
        classDecl: ClassDeclaration,
        sourceFile: SourceFile
    ): ExtractedController {
        const methods = classDecl
            .getMethods()
            .map((method) => this.extractMethod(method))

        // Extract base path from @Controller decorator
        const controllerDecorator = classDecl.getDecorator('Controller')
        let basePath: string | undefined
        if (controllerDecorator) {
            const args = controllerDecorator.getArguments()
            if (args.length > 0) {
                const arg = args[0]
                if (arg.getKind() === 10) {
                    // StringLiteral
                    basePath = arg.getText().replace(/['"]/g, '')
                }
            }
        }

        return {
            name: classDecl.getName() || 'AnonymousController',
            filePath: sourceFile.getFilePath(),
            basePath,
            methods,
        }
    }

    private extractMethod(methodDecl: MethodDeclaration): ExtractedMethod {
        const parameters = methodDecl.getParameters().map((param) => ({
            name: param.getName(),
            type: param.getTypeNode() ? param.getTypeNode()!.getText() : 'any',
            optional: param.hasQuestionToken(),
            decorator: this.getParameterDecorator(param),
        }))

        const decorators = methodDecl
            .getDecorators()
            .map((decorator) => decorator.getName())

        return {
            name: methodDecl.getName(),
            parameters,
            returnType: methodDecl.getReturnTypeNode()
                ? methodDecl.getReturnTypeNode()!.getText()
                : 'void',
            decorators,
            isPublic:
                !methodDecl.hasModifier('private') &&
                !methodDecl.hasModifier('protected'),
        }
    }

    private getParameterDecorator(param: any): string | undefined {
        // Extract decorator from parameter
        const decorators = param.getDecorators()
        if (decorators.length > 0) {
            return decorators[0].getName()
        }
        return undefined
    }
}
