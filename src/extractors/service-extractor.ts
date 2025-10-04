import {
    ClassDeclaration,
    MethodDeclaration,
    Project,
    SourceFile,
} from 'ts-morph'
import { MethodInfo, ParameterInfo } from '../types/common.types'
import { ServiceInfo } from '../types/service.types'

export class ServiceExtractor {
    private project: Project

    constructor(project: Project) {
        this.project = project
    }

    /**
     * Extract service information from a source file
     */
    extractServiceInfo(sourceFile: SourceFile): ServiceInfo | null {
        const classes = sourceFile.getClasses()

        for (const classDeclaration of classes) {
            if (this.isService(classDeclaration)) {
                return {
                    name: classDeclaration.getName() || 'UnknownService',
                    filePath: sourceFile.getFilePath(),
                    dependencies: this.extractDependencies(classDeclaration),
                    methods: this.extractMethods(classDeclaration),
                }
            }
        }

        return null
    }

    /**
     * Check if a class is a service (has @Injectable decorator)
     */
    private isService(classDeclaration: ClassDeclaration): boolean {
        const decorators = classDeclaration.getDecorators()

        return decorators.some((decorator) => {
            const decoratorName = decorator.getName()
            return decoratorName === 'Injectable'
        })
    }

    /**
     * Extract constructor dependencies
     */
    private extractDependencies(classDeclaration: ClassDeclaration): string[] {
        const constructor = classDeclaration.getConstructors()[0]

        if (!constructor) {
            return []
        }

        const dependencies: string[] = []
        const parameters = constructor.getParameters()

        for (const param of parameters) {
            const typeNode = param.getTypeNode()
            if (typeNode) {
                dependencies.push(typeNode.getText())
            } else {
                // Try to get type from type checker
                try {
                    const type = param.getType()
                    dependencies.push(type.getText())
                } catch {
                    dependencies.push('any')
                }
            }
        }

        return dependencies
    }

    /**
     * Extract all methods from a service class
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
