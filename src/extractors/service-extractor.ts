import { join } from 'path'
import {
    ClassDeclaration,
    MethodDeclaration,
    Project,
    SourceFile,
} from 'ts-morph'

export interface ExtractedService {
    name: string
    filePath: string
    methods: ExtractedMethod[]
    properties: ExtractedProperty[]
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
}

export interface ExtractedProperty {
    name: string
    type: string
    optional: boolean
}

export class ServiceExtractor {
    private project: Project

    constructor(projectPath: string) {
        this.project = new Project({
            tsConfigFilePath: join(projectPath, 'tsconfig.json'),
        })
    }

    extractServices(): ExtractedService[] {
        const services: ExtractedService[] = []
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
                // Check if this class is a service
                if (this.isService(classDecl)) {
                    services.push(this.extractService(classDecl, sourceFile))
                }
            }
        }

        return services
    }

    private isService(classDecl: ClassDeclaration): boolean {
        // Check if class has @Injectable decorator or ends with 'Service'
        const decorators = classDecl.getDecorators()
        const hasInjectable = decorators.some(
            (decorator) => decorator.getName() === 'Injectable'
        )
        const nameEndsWithService =
            classDecl.getName()?.endsWith('Service') || false

        return hasInjectable || nameEndsWithService
    }

    private extractService(
        classDecl: ClassDeclaration,
        sourceFile: SourceFile
    ): ExtractedService {
        const methods = classDecl
            .getMethods()
            .map((method) => this.extractMethod(method))
        const properties = classDecl.getProperties().map((prop) => ({
            name: prop.getName(),
            type: prop.getTypeNode() ? prop.getTypeNode()!.getText() : 'any',
            optional: prop.hasQuestionToken(),
        }))

        return {
            name: classDecl.getName() || 'AnonymousService',
            filePath: sourceFile.getFilePath(),
            methods,
            properties,
        }
    }

    private extractMethod(methodDecl: MethodDeclaration): ExtractedMethod {
        const parameters = methodDecl.getParameters().map((param) => ({
            name: param.getName(),
            type: param.getTypeNode() ? param.getTypeNode()!.getText() : 'any',
            optional: param.hasQuestionToken(),
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
}
