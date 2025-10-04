import {
    ClassDeclaration,
    MethodDeclaration,
    Project,
    SourceFile,
} from 'ts-morph'
import { MethodInfo, ParameterInfo } from '../types/common.types'
import { ControllerInfo } from '../types/controller.types'

export class ControllerExtractor {
    private project: Project
    private options?: any

    constructor(project: Project, options?: any) {
        this.project = project
        this.options = options
    }

    /**
     * Extract controller information from a source file
     */
    extractControllerInfo(sourceFile: SourceFile): ControllerInfo | null {
        const classes = sourceFile.getClasses()

        for (const classDeclaration of classes) {
            if (this.isController(classDeclaration)) {
                return {
                    name: classDeclaration.getName() || 'UnknownController',
                    filePath: sourceFile.getFilePath(),
                    basePath: this.extractBasePath(classDeclaration),
                    methods: this.extractMethods(classDeclaration),
                }
            }
        }

        return null
    }

    /**
     * Check if a class is a controller (has @Controller decorator)
     */
    private isController(classDeclaration: ClassDeclaration): boolean {
        const decorators = classDeclaration.getDecorators()

        return decorators.some((decorator) => {
            const decoratorName = decorator.getName()
            return decoratorName === 'Controller'
        })
    }

    /**
     * Extract the base path from @Controller decorator
     */
    private extractBasePath(
        classDeclaration: ClassDeclaration
    ): string | undefined {
        const controllerDecorator = classDeclaration.getDecorator('Controller')

        if (!controllerDecorator) {
            return undefined
        }

        const args = controllerDecorator.getArguments()
        if (args.length > 0) {
            const firstArg = args[0]
            if (firstArg.getKind() === 10) {
                // StringLiteral
                const path = firstArg.getText().replace(/['"]/g, '')
                if (this.options?.verbose) {
                    console.log(`Found controller path: "${path}"`)
                }
                return path
            } else {
                // Try to get text representation for other types
                const text = firstArg.getText()
                if (this.options?.verbose) {
                    console.log(
                        `Controller decorator arg type: ${firstArg.getKind()}, text: "${text}"`
                    )
                }
                if (text && text !== 'undefined') {
                    return text.replace(/['"`]/g, '')
                }
            }
        }

        return undefined
    }

    /**
     * Extract all methods from a controller class
     */
    private extractMethods(classDeclaration: ClassDeclaration): MethodInfo[] {
        const methods: MethodInfo[] = []
        const methodDeclarations = classDeclaration.getMethods()

        for (const method of methodDeclarations) {
            // Skip constructor and private methods by default
            if (method.getKind() === 173 || method.hasModifier('private')) {
                // Constructor
                continue
            }

            methods.push({
                name: method.getName(),
                parameters: this.extractParameters(method),
                returnType: this.extractReturnType(method),
                decorators: this.extractDecorators(method),
                isPublic:
                    method.hasModifier('public') ||
                    (!method.hasModifier('private') &&
                        !method.hasModifier('protected')),
            })
        }

        return methods
    }

    /**
     * Extract parameters from a method
     */
    private extractParameters(method: MethodDeclaration): ParameterInfo[] {
        const parameters: ParameterInfo[] = []
        const methodParameters = method.getParameters()

        for (const param of methodParameters) {
            const decorators = param.getDecorators()
            const decoratorNames = decorators.map((d) => d.getName())

            parameters.push({
                name: param.getName(),
                type: param.getTypeNode()?.getText() || 'any',
                decorator:
                    decoratorNames.length > 0 ? decoratorNames[0] : undefined,
                optional: param.hasQuestionToken(),
            })
        }

        return parameters
    }

    /**
     * Extract return type from a method
     */
    private extractReturnType(method: MethodDeclaration): string {
        const returnTypeNode = method.getReturnTypeNode()

        if (returnTypeNode) {
            return returnTypeNode.getText()
        }

        // Try to infer from type checker
        try {
            const returnType = method.getReturnType()
            return returnType.getText()
        } catch {
            return 'any'
        }
    }

    /**
     * Extract decorators from a method
     */
    private extractDecorators(method: MethodDeclaration): string[] {
        const decorators = method.getDecorators()
        return decorators.map((decorator) => decorator.getName())
    }
}
