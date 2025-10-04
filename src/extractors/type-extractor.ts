import {
    ClassDeclaration,
    EnumDeclaration,
    InterfaceDeclaration,
    Project,
    PropertyDeclaration,
    SourceFile,
} from 'ts-morph'
import {
    ExtractedType,
    ImportInfo,
    PropertyInfo,
    TypeExtractionOptions,
    ValidationRule,
} from '../types/type-extraction.types'

export class TypeExtractor {
    private project: Project
    private options: TypeExtractionOptions

    constructor(project: Project, options: TypeExtractionOptions = {}) {
        this.project = project
        this.options = {
            includeInterfaces: true,
            includeClasses: true,
            includeEnums: true,
            includeGenerics: true,
            includeValidationRules: true,
            includeDecorators: true,
            includeImports: true,
            maxDepth: 3,
            ...options,
        }
    }

    extractAllTypes(sourceFiles: SourceFile[]): ExtractedType[] {
        const types: ExtractedType[] = []

        for (const sourceFile of sourceFiles) {
            // Extract interfaces
            if (this.options.includeInterfaces) {
                types.push(...this.extractInterfaces(sourceFile))
            }

            // Extract classes (DTOs, etc.)
            if (this.options.includeClasses) {
                types.push(...this.extractClasses(sourceFile))
            }

            // Extract enums
            if (this.options.includeEnums) {
                types.push(...this.extractEnums(sourceFile))
            }
        }

        return types
    }

    private extractInterfaces(sourceFile: SourceFile): ExtractedType[] {
        const interfaces: ExtractedType[] = []
        const interfaceDeclarations = sourceFile.getInterfaces()

        for (const interfaceDecl of interfaceDeclarations) {
            interfaces.push({
                name: interfaceDecl.getName(),
                type: 'interface',
                filePath: sourceFile.getFilePath(),
                definition: `export interface ${interfaceDecl.getName()}`,
                properties: this.extractProperties(interfaceDecl),
                decorators: [],
                imports: this.extractImports(sourceFile),
                exports: [interfaceDecl.getName()],
                dependencies: this.extractDependencies(interfaceDecl),
            })
        }

        return interfaces
    }

    private extractClasses(sourceFile: SourceFile): ExtractedType[] {
        const classes: ExtractedType[] = []
        const classDeclarations = sourceFile.getClasses()

        for (const classDecl of classDeclarations) {
            classes.push({
                name: classDecl.getName() || 'AnonymousClass',
                type: 'class',
                filePath: sourceFile.getFilePath(),
                definition: `export class ${classDecl.getName()}`,
                properties: this.extractProperties(classDecl),
                methods: this.extractMethods(classDecl),
                decorators: this.extractClassDecorators(classDecl),
                imports: this.extractImports(sourceFile),
                exports: [classDecl.getName() || 'AnonymousClass'],
                dependencies: this.extractDependencies(classDecl),
                validationRules: this.extractClassValidationRules(classDecl),
            })
        }

        return classes
    }

    private extractEnums(sourceFile: SourceFile): ExtractedType[] {
        const enums: ExtractedType[] = []
        const enumDeclarations = sourceFile.getEnums()

        for (const enumDecl of enumDeclarations) {
            enums.push({
                name: enumDecl.getName(),
                type: 'enum',
                filePath: sourceFile.getFilePath(),
                definition: `export enum ${enumDecl.getName()}`,
                properties: this.extractEnumMembers(enumDecl),
                decorators: [],
                imports: this.extractImports(sourceFile),
                exports: [enumDecl.getName()],
                dependencies: [],
            })
        }

        return enums
    }

    private extractProperties(
        classOrInterface: ClassDeclaration | InterfaceDeclaration
    ): PropertyInfo[] {
        const properties: PropertyInfo[] = []

        // Get properties from class/interface
        const propertyDeclarations = classOrInterface.getProperties()

        for (const property of propertyDeclarations) {
            // Handle both PropertyDeclaration (classes) and PropertySignature (interfaces)
            const isPropertyDeclaration = 'getInitializer' in property

            properties.push({
                name: property.getName(),
                type: this.extractPropertyType(property),
                optional: property.hasQuestionToken(),
                decorators: isPropertyDeclaration
                    ? this.extractPropertyDecorators(property as any)
                    : [],
                validationRules: isPropertyDeclaration
                    ? this.extractValidationRules(property as any)
                    : [],
                defaultValue: isPropertyDeclaration
                    ? this.extractDefaultValue(property as any)
                    : undefined,
            })
        }

        return properties
    }

    private extractEnumMembers(enumDecl: EnumDeclaration): PropertyInfo[] {
        const members: PropertyInfo[] = []
        const enumMembers = enumDecl.getMembers()

        for (const member of enumMembers) {
            members.push({
                name: member.getName(),
                type: 'string | number',
                optional: false,
                decorators: [],
                validationRules: [],
                defaultValue: member.getValue(),
            })
        }

        return members
    }

    private extractPropertyType(property: PropertyDeclaration | any): string {
        const typeNode = property.getTypeNode()
        if (typeNode) {
            return typeNode.getText()
        }

        // Try to infer from type checker
        try {
            const type = property.getType()
            return type.getText()
        } catch {
            return 'any'
        }
    }

    private extractPropertyDecorators(property: PropertyDeclaration | any): string[] {
        // Only PropertyDeclaration has getDecorators method
        if (typeof property.getDecorators === 'function') {
            const decorators = property.getDecorators()
            return decorators.map((decorator: any) => decorator.getName())
        }
        return []
    }

    private extractValidationRules(
        property: PropertyDeclaration | any
    ): ValidationRule[] {
        if (!this.options.includeValidationRules) {
            return []
        }

        // Only PropertyDeclaration has getDecorators method
        if (typeof property.getDecorators !== 'function') {
            return []
        }
        
        const decorators = property.getDecorators()
        return decorators.map((decorator) => ({
            decorator: decorator.getName(),
            parameters: decorator.getArguments().map((arg) => arg.getText()),
            message: this.extractValidationMessage(decorator),
        }))
    }

    private extractValidationMessage(decorator: any): string | undefined {
        const args = decorator.getArguments()
        if (args.length > 0) {
            const firstArg = args[0]
            if (firstArg.getKind() === 10) {
                // StringLiteral
                return firstArg.getText().replace(/['"]/g, '')
            }
        }
        return undefined
    }

    private extractDefaultValue(property: PropertyDeclaration): any {
        const initializer = property.getInitializer()
        if (initializer) {
            return initializer.getText()
        }
        return undefined
    }

    private extractMethods(classDecl: ClassDeclaration): any[] {
        const methods: any[] = []
        const methodDeclarations = classDecl.getMethods()

        for (const method of methodDeclarations) {
            methods.push({
                name: method.getName(),
                parameters: method.getParameters().map((param) => ({
                    name: param.getName(),
                    type: param.getTypeNode()?.getText() || 'any',
                    optional: param.hasQuestionToken(),
                })),
                returnType: method.getReturnTypeNode()?.getText() || 'any',
                decorators: method.getDecorators().map((d) => d.getName()),
                isPublic:
                    method.hasModifier('public') ||
                    (!method.hasModifier('private') &&
                        !method.hasModifier('protected')),
            })
        }

        return methods
    }

    private extractClassDecorators(classDecl: ClassDeclaration): string[] {
        const decorators = classDecl.getDecorators()
        return decorators.map((decorator) => decorator.getName())
    }

    private extractClassValidationRules(
        classDecl: ClassDeclaration
    ): ValidationRule[] {
        // Extract validation rules from class-level decorators
        const decorators = classDecl.getDecorators()
        return decorators.map((decorator) => ({
            decorator: decorator.getName(),
            parameters: decorator.getArguments().map((arg) => arg.getText()),
            message: undefined,
        }))
    }

    private extractImports(sourceFile: SourceFile): ImportInfo[] {
        if (!this.options.includeImports) {
            return []
        }

        const imports: ImportInfo[] = []
        const importDeclarations = sourceFile.getImportDeclarations()

        for (const importDecl of importDeclarations) {
            const moduleSpecifier = importDecl.getModuleSpecifierValue()
            const namedImports = importDecl.getNamedImports()
            const defaultImport = importDecl.getDefaultImport()

            // Add default import
            if (defaultImport) {
                imports.push({
                    name: defaultImport.getText(),
                    from: moduleSpecifier,
                    isDefault: true,
                    isNamespace: false,
                })
            }

            // Add named imports
            for (const namedImport of namedImports) {
                imports.push({
                    name: namedImport.getName(),
                    from: moduleSpecifier,
                    isDefault: false,
                    isNamespace: false,
                })
            }
        }

        return imports
    }

    private extractDependencies(
        classOrInterface: ClassDeclaration | InterfaceDeclaration
    ): string[] {
        const dependencies: string[] = []

        // Extract from properties
        const properties = classOrInterface.getProperties()
        for (const property of properties) {
            const type = this.extractPropertyType(property)
            if (
                type &&
                type !== 'any' &&
                type !== 'string' &&
                type !== 'number' &&
                type !== 'boolean'
            ) {
                dependencies.push(type)
            }
        }

        // Extract from methods if it's a class
        if (classOrInterface instanceof ClassDeclaration) {
            const methods = classOrInterface.getMethods()
            for (const method of methods) {
                const returnType = method.getReturnTypeNode()?.getText()
                if (
                    returnType &&
                    returnType !== 'any' &&
                    returnType !== 'void'
                ) {
                    dependencies.push(returnType)
                }
            }
        }

        return [...new Set(dependencies)] // Remove duplicates
    }
}
