import {
    ClassDeclaration,
    MethodDeclaration,
    Project,
    SourceFile,
} from 'ts-morph'
import { MethodInfo, ParameterInfo } from '../types/common.types'
import { ControllerInfo } from '../types/controller.types'
import { TypeResolver } from '../core/type-resolver'
import { SchemaGenerator } from '../generators/schema-generator'
import { 
    EnhancedControllerInfo, 
    EnhancedApiEndpoint, 
    HTTP_METHODS, 
    PARAMETER_DECORATORS 
} from '../types/enhanced-output.types'

export class ControllerExtractor {
    private project: Project
    private typeResolver: TypeResolver
    private schemaGenerator: SchemaGenerator

    constructor(project: Project) {
        this.project = project
        this.typeResolver = new TypeResolver(project)
        this.schemaGenerator = new SchemaGenerator()
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
                return firstArg.getText().replace(/['"]/g, '')
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

    /**
     * Set source files for type resolution
     */
    setSourceFiles(sourceFiles: SourceFile[]): void {
        this.typeResolver.setSourceFiles(sourceFiles)
    }

    /**
     * Extract enhanced controller information with API endpoints
     */
    extractEnhancedControllerInfo(sourceFile: SourceFile): EnhancedControllerInfo | null {
        const classes = sourceFile.getClasses()

        for (const classDeclaration of classes) {
            if (this.isController(classDeclaration)) {
                const basePath = this.extractBasePath(classDeclaration)
                const endpoints = this.extractApiEndpoints(classDeclaration, basePath, sourceFile)

                return {
                    name: classDeclaration.getName() || 'UnknownController',
                    filePath: sourceFile.getFilePath(),
                    basePath,
                    endpoints,
                    decorators: classDeclaration.getDecorators().map(d => d.getName()),
                    imports: this.extractImports(sourceFile),
                    dependencies: this.extractDependencies(classDeclaration)
                }
            }
        }

        return null
    }

    /**
     * Extract API endpoints from controller methods
     */
    private extractApiEndpoints(
        classDeclaration: ClassDeclaration, 
        basePath: string | undefined,
        sourceFile: SourceFile
    ): EnhancedApiEndpoint[] {
        const endpoints: EnhancedApiEndpoint[] = []
        const methodDeclarations = classDeclaration.getMethods()

        for (const method of methodDeclarations) {
            if (method.getKind() === 173 || method.hasModifier('private')) {
                continue // Skip constructor and private methods
            }

            const httpMethod = this.extractHttpMethod(method)
            if (httpMethod) {
                const endpoint = this.createApiEndpoint(method, httpMethod, basePath, sourceFile)
                if (endpoint) {
                    endpoints.push(endpoint)
                }
            }
        }

        return endpoints
    }

    /**
     * Extract HTTP method from method decorators
     */
    private extractHttpMethod(method: MethodDeclaration): string | null {
        const decorators = method.getDecorators()
        
        for (const decorator of decorators) {
            const decoratorName = decorator.getName()
            if (HTTP_METHODS[decoratorName]) {
                return HTTP_METHODS[decoratorName].method
            }
        }

        return null
    }

    /**
     * Create API endpoint from method
     */
    private createApiEndpoint(
        method: MethodDeclaration,
        httpMethod: string,
        basePath: string | undefined,
        sourceFile: SourceFile
    ): EnhancedApiEndpoint | null {
        const methodPath = this.extractMethodPath(method)
        const fullPath = this.buildFullPath(basePath, methodPath)
        
        const parameters = this.extractEnhancedParameters(method, sourceFile)
        const requestSchema = this.generateRequestSchema(method, sourceFile)
        const responseSchema = this.generateResponseSchema(method, sourceFile)
        const examples = this.generateExamples(requestSchema, responseSchema)

        return {
            method: httpMethod,
            path: methodPath,
            fullPath,
            summary: this.generateMethodSummary(method.getName(), httpMethod),
            description: this.extractJSDocDescription(method),
            requestSchema,
            responseSchema,
            parameters,
            validationRules: this.extractValidationRules(method),
            examples: [examples],
            statusCodes: this.generateStatusCodes(httpMethod)
        }
    }

    /**
     * Extract method path from decorators
     */
    private extractMethodPath(method: MethodDeclaration): string {
        const decorators = method.getDecorators()
        
        for (const decorator of decorators) {
            const decoratorName = decorator.getName()
            if (HTTP_METHODS[decoratorName]) {
                const args = decorator.getArguments()
                if (args.length > 0) {
                    const firstArg = args[0]
                    if (firstArg.getKind() === 10) { // StringLiteral
                        return firstArg.getText().replace(/['"]/g, '')
                    }
                }
                return '' // Default empty path
            }
        }

        return ''
    }

    /**
     * Build full path from base path and method path
     */
    private buildFullPath(basePath: string | undefined, methodPath: string): string {
        const base = basePath || ''
        const method = methodPath || ''
        
        if (!base && !method) return '/'
        if (!base) return method.startsWith('/') ? method : `/${method}`
        if (!method) return base.startsWith('/') ? base : `/${base}`
        
        const combined = `${base}/${method}`.replace(/\/+/g, '/')
        return combined.startsWith('/') ? combined : `/${combined}`
    }

    /**
     * Extract enhanced parameters with type resolution
     */
    private extractEnhancedParameters(method: MethodDeclaration, sourceFile: SourceFile): any[] {
        const parameters: any[] = []
        const methodParameters = method.getParameters()

        for (const param of methodParameters) {
            const decorators = param.getDecorators()
            const decoratorNames = decorators.map((d) => d.getName())
            const location = this.getParameterLocation(decoratorNames[0])

            const paramType = param.getTypeNode()?.getText() || 'any'
            const resolvedType = this.typeResolver.resolveType(paramType, sourceFile)
            const schema = this.schemaGenerator.generateSchema(resolvedType)

            parameters.push({
                name: param.getName(),
                type: paramType,
                location,
                required: !param.hasQuestionToken(),
                description: this.extractJSDocDescription(param),
                validationRules: this.extractParameterValidationRules(param),
                schema
            })
        }

        return parameters
    }

    /**
     * Get parameter location from decorator
     */
    private getParameterLocation(decoratorName: string | undefined): 'path' | 'query' | 'body' | 'header' {
        if (!decoratorName) return 'body'
        return PARAMETER_DECORATORS[decoratorName] as any || 'body'
    }

    /**
     * Generate request schema
     */
    private generateRequestSchema(method: MethodDeclaration, sourceFile: SourceFile): any {
        const parameters = method.getParameters()
        
        for (const param of parameters) {
            const decorators = param.getDecorators()
            const decoratorNames = decorators.map((d) => d.getName())
            
            if (decoratorNames.includes('Body')) {
                const paramType = param.getTypeNode()?.getText() || 'any'
                const resolvedType = this.typeResolver.resolveType(paramType, sourceFile)
                return this.schemaGenerator.generateSchema(resolvedType)
            }
        }

        return undefined
    }

    /**
     * Generate response schema
     */
    private generateResponseSchema(method: MethodDeclaration, sourceFile: SourceFile): any {
        const returnType = method.getReturnTypeNode()?.getText() || 'any'
        const resolvedType = this.typeResolver.resolveType(returnType, sourceFile)
        return this.schemaGenerator.generateSchema(resolvedType)
    }

    /**
     * Generate examples
     */
    private generateExamples(requestSchema?: any, responseSchema?: any): any {
        return this.schemaGenerator.generateExamples(requestSchema, responseSchema)
    }

    /**
     * Generate method summary
     */
    private generateMethodSummary(methodName: string, httpMethod: string): string {
        const action = this.getActionFromMethodName(methodName)
        return `${action} ${httpMethod} endpoint`
    }

    /**
     * Get action from method name
     */
    private getActionFromMethodName(methodName: string): string {
        const actionMap: Record<string, string> = {
            'create': 'Create',
            'findAll': 'Get all',
            'findOne': 'Get',
            'update': 'Update',
            'remove': 'Delete',
            'delete': 'Delete'
        }

        for (const [key, value] of Object.entries(actionMap)) {
            if (methodName.toLowerCase().includes(key)) {
                return value
            }
        }

        return 'Handle'
    }

    /**
     * Extract validation rules from method
     */
    private extractValidationRules(method: MethodDeclaration): any[] {
        // This would extract validation rules from method decorators
        // For now, return empty array
        return []
    }

    /**
     * Extract parameter validation rules
     */
    private extractParameterValidationRules(param: any): any[] {
        // This would extract validation rules from parameter decorators
        // For now, return empty array
        return []
    }

    /**
     * Generate status codes for HTTP method
     */
    private generateStatusCodes(httpMethod: string): any[] {
        const statusCodeMap: Record<string, any[]> = {
            'GET': [
                { code: 200, description: 'Success' },
                { code: 404, description: 'Not found' }
            ],
            'POST': [
                { code: 201, description: 'Created' },
                { code: 400, description: 'Bad request' }
            ],
            'PUT': [
                { code: 200, description: 'Success' },
                { code: 404, description: 'Not found' }
            ],
            'PATCH': [
                { code: 200, description: 'Success' },
                { code: 404, description: 'Not found' }
            ],
            'DELETE': [
                { code: 200, description: 'Success' },
                { code: 404, description: 'Not found' }
            ]
        }

        return statusCodeMap[httpMethod] || [{ code: 200, description: 'Success' }]
    }

    /**
     * Extract JSDoc description
     */
    private extractJSDocDescription(node: any): string | undefined {
        try {
            const jsDoc = node.getJsDocs()[0]
            if (jsDoc) {
                return jsDoc.getDescription()
            }
        } catch {
            // Ignore errors
        }
        return undefined
    }

    /**
     * Extract imports from source file
     */
    private extractImports(sourceFile: SourceFile): any[] {
        const imports: any[] = []
        const importDeclarations = sourceFile.getImportDeclarations()

        for (const importDecl of importDeclarations) {
            const moduleSpecifier = importDecl.getModuleSpecifierValue()
            const namedImports = importDecl.getNamedImports()
            const defaultImport = importDecl.getDefaultImport()

            if (defaultImport) {
                imports.push({
                    name: defaultImport.getText(),
                    from: moduleSpecifier,
                    isDefault: true,
                    isNamespace: false
                })
            }

            for (const namedImport of namedImports) {
                imports.push({
                    name: namedImport.getName(),
                    from: moduleSpecifier,
                    isDefault: false,
                    isNamespace: false
                })
            }
        }

        return imports
    }

    /**
     * Extract dependencies from class
     */
    private extractDependencies(classDeclaration: ClassDeclaration): string[] {
        const dependencies: string[] = []
        const methods = classDeclaration.getMethods()

        for (const method of methods) {
            const returnType = method.getReturnTypeNode()?.getText()
            if (returnType && returnType !== 'any' && returnType !== 'void') {
                dependencies.push(returnType)
            }
        }

        return [...new Set(dependencies)]
    }
}
