import { join } from 'path'
import {
    ClassDeclaration,
    InterfaceDeclaration,
    Project,
    SourceFile,
    TypeAliasDeclaration,
} from 'ts-morph'

export interface ExtractedType {
    name: string
    type: 'interface' | 'class' | 'type'
    filePath: string
    properties: TypeProperty[]
    methods?: TypeMethod[]
}

export interface TypeProperty {
    name: string
    type: string
    optional: boolean
    nested?: ExtractedType
}

export interface TypeMethod {
    name: string
    parameters: TypeParameter[]
    returnType: string
    decorators: string[]
    isPublic: boolean
}

export interface TypeParameter {
    name: string
    type: string
    optional: boolean
    decorator?: string
}

export class TypeExtractor {
    private project: Project

    constructor(projectPath: string) {
        this.project = new Project({
            tsConfigFilePath: join(projectPath, 'tsconfig.json'),
        })
    }

    extractTypes(): ExtractedType[] {
        const types: ExtractedType[] = []
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

            // Extract interfaces
            const interfaces = sourceFile.getInterfaces()
            for (const interfaceDecl of interfaces) {
                types.push(this.extractInterface(interfaceDecl, sourceFile))
            }

            // Extract type aliases
            const typeAliases = sourceFile.getTypeAliases()
            for (const typeAlias of typeAliases) {
                types.push(this.extractTypeAlias(typeAlias, sourceFile))
            }

            // Extract classes
            const classes = sourceFile.getClasses()
            for (const classDecl of classes) {
                types.push(this.extractClass(classDecl, sourceFile))
            }
        }

        return types
    }

    private extractInterface(
        interfaceDecl: InterfaceDeclaration,
        sourceFile: SourceFile
    ): ExtractedType {
        const properties = interfaceDecl.getProperties().map((prop) => {
            const typeNode = prop.getTypeNode()
            const typeText = typeNode ? typeNode.getText() : 'any'

            return {
                name: prop.getName(),
                type: this.simplifyType(typeText),
                optional: prop.hasQuestionToken(),
                nested: this.extractNestedType(typeText),
            }
        })

        return {
            name: interfaceDecl.getName(),
            type: 'interface',
            filePath: sourceFile.getFilePath(),
            properties,
        }
    }

    private extractTypeAlias(
        typeAlias: TypeAliasDeclaration,
        sourceFile: SourceFile
    ): ExtractedType {
        const typeNode = typeAlias.getTypeNode()
        const typeText = typeNode ? typeNode.getText() : 'any'

        return {
            name: typeAlias.getName(),
            type: 'type',
            filePath: sourceFile.getFilePath(),
            properties: [
                {
                    name: 'value',
                    type: this.simplifyType(typeText),
                    optional: false,
                    nested: this.extractNestedType(typeText),
                },
            ],
        }
    }

    private extractClass(
        classDecl: ClassDeclaration,
        sourceFile: SourceFile
    ): ExtractedType {
        const properties = classDecl.getProperties().map((prop) => {
            const typeNode = prop.getTypeNode()
            const typeText = typeNode ? typeNode.getText() : 'any'

            return {
                name: prop.getName(),
                type: this.simplifyType(typeText),
                optional: prop.hasQuestionToken(),
                nested: this.extractNestedType(typeText),
            }
        })

        const methods = classDecl.getMethods().map((method) => {
            const parameters = method.getParameters().map((param) => ({
                name: param.getName(),
                type: param.getTypeNode()
                    ? param.getTypeNode()!.getText()
                    : 'any',
                optional: param.hasQuestionToken(),
                decorator: this.getParameterDecorator(param),
            }))

            return {
                name: method.getName(),
                parameters,
                returnType: method.getReturnTypeNode()
                    ? method.getReturnTypeNode()!.getText()
                    : 'void',
                decorators: method.getDecorators().map((dec) => dec.getName()),
                isPublic:
                    !method.hasModifier('private') &&
                    !method.hasModifier('protected'),
            }
        })

        return {
            name: classDecl.getName() || 'AnonymousClass',
            type: 'class',
            filePath: sourceFile.getFilePath(),
            properties,
            methods,
        }
    }

    private extractNestedType(typeText: string): ExtractedType | undefined {
        // Check if this is a complex nested type
        if (typeText.includes('{') && typeText.includes('}')) {
            try {
                // This is a simplified approach - in a real implementation,
                // you'd want to use TypeScript's type checker for more accurate parsing
                const nestedProperties = this.parseNestedProperties(typeText)
                if (nestedProperties.length > 0) {
                    return {
                        name: 'NestedType',
                        type: 'interface',
                        filePath: '',
                        properties: nestedProperties,
                    }
                }
            } catch (error) {
                // If parsing fails, return undefined
            }
        }
        return undefined
    }

    private parseNestedProperties(typeText: string): TypeProperty[] {
        const properties: TypeProperty[] = []

        // Simple regex-based parsing for nested object types
        // This is a basic implementation - for production, use TypeScript's type checker
        const propertyRegex = /(\w+)(\?)?\s*:\s*([^;,}]+)/g
        let match

        while ((match = propertyRegex.exec(typeText)) !== null) {
            const [, name, optional, type] = match
            properties.push({
                name: name.trim(),
                type: this.simplifyType(type.trim()),
                optional: !!optional,
                nested: this.extractNestedType(type.trim()),
            })
        }

        return properties
    }

    private simplifyType(typeText: string): string {
        // Remove extra whitespace and simplify common patterns
        return typeText
            .replace(/\s+/g, ' ')
            .replace(/\s*;\s*$/, '')
            .trim()
    }

    private getParameterDecorator(param: any): string | undefined {
        // This would need to be implemented based on how decorators are stored
        // For now, return undefined
        return undefined
    }
}
