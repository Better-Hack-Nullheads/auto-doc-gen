import {
    ClassDeclaration,
    InterfaceDeclaration,
    Project,
    SourceFile,
    TypeNode,
    Type,
} from 'ts-morph'

export interface ResolvedType {
    name: string
    type: 'interface' | 'class' | 'enum' | 'primitive' | 'array' | 'union'
    properties?: PropertyInfo[]
    items?: ResolvedType // For arrays
    unionTypes?: ResolvedType[] // For union types
    filePath?: string
    description?: string
}

export interface PropertyInfo {
    name: string
    type: ResolvedType
    optional: boolean
    description?: string
    defaultValue?: any
}

export class TypeResolver {
    private project: Project
    private typeCache: Map<string, ResolvedType> = new Map()
    private sourceFiles: SourceFile[] = []

    constructor(project: Project) {
        this.project = project
    }

    /**
     * Set source files for type resolution
     */
    setSourceFiles(sourceFiles: SourceFile[]): void {
        this.sourceFiles = sourceFiles
    }

    /**
     * Resolve a type name to its full definition
     */
    resolveType(typeName: string, sourceFile?: SourceFile): ResolvedType {
        // Check cache first
        const cacheKey = `${typeName}:${sourceFile?.getFilePath() || 'global'}`
        if (this.typeCache.has(cacheKey)) {
            return this.typeCache.get(cacheKey)!
        }

        // Clean type name (remove generics, arrays, etc.)
        const cleanTypeName = this.cleanTypeName(typeName)
        
        // Handle primitive types
        if (this.isPrimitiveType(cleanTypeName)) {
            const resolved = this.createPrimitiveType(cleanTypeName)
            this.typeCache.set(cacheKey, resolved)
            return resolved
        }

        // Handle array types
        if (typeName.endsWith('[]')) {
            const elementType = typeName.slice(0, -2)
            const resolved = this.createArrayType(elementType, sourceFile)
            this.typeCache.set(cacheKey, resolved)
            return resolved
        }

        // Handle union types
        if (typeName.includes(' | ')) {
            const resolved = this.createUnionType(typeName, sourceFile)
            this.typeCache.set(cacheKey, resolved)
            return resolved
        }

        // Search for type definition
        const resolved = this.findTypeDefinition(cleanTypeName, sourceFile)
        this.typeCache.set(cacheKey, resolved)
        return resolved
    }

    /**
     * Resolve type from TypeNode
     */
    resolveTypeNode(typeNode: TypeNode, sourceFile?: SourceFile): ResolvedType {
        const typeText = typeNode.getText()
        return this.resolveType(typeText, sourceFile)
    }

    /**
     * Resolve type from Type
     */
    resolveTypeFromType(type: Type, sourceFile?: SourceFile): ResolvedType {
        const typeText = type.getText()
        return this.resolveType(typeText, sourceFile)
    }

    /**
     * Clean type name by removing generics and other modifiers
     */
    private cleanTypeName(typeName: string): string {
        return typeName
            .replace(/<.*>/, '') // Remove generics
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim()
    }

    /**
     * Check if type is primitive
     */
    private isPrimitiveType(typeName: string): boolean {
        const primitives = [
            'string', 'number', 'boolean', 'any', 'void', 'null', 'undefined',
            'Date', 'Array', 'Object', 'Function', 'Promise'
        ]
        return primitives.includes(typeName)
    }

    /**
     * Create primitive type
     */
    private createPrimitiveType(typeName: string): ResolvedType {
        return {
            name: typeName,
            type: 'primitive',
            description: `Primitive type: ${typeName}`
        }
    }

    /**
     * Create array type
     */
    private createArrayType(elementTypeName: string, sourceFile?: SourceFile): ResolvedType {
        const elementType = this.resolveType(elementTypeName, sourceFile)
        return {
            name: `${elementTypeName}[]`,
            type: 'array',
            items: elementType,
            description: `Array of ${elementTypeName}`
        }
    }

    /**
     * Create union type
     */
    private createUnionType(unionTypeName: string, sourceFile?: SourceFile): ResolvedType {
        const types = unionTypeName.split(' | ').map(t => t.trim())
        const unionTypes = types.map(type => this.resolveType(type, sourceFile))
        
        return {
            name: unionTypeName,
            type: 'union',
            unionTypes,
            description: `Union type: ${unionTypeName}`
        }
    }

    /**
     * Find type definition in source files
     */
    private findTypeDefinition(typeName: string, sourceFile?: SourceFile): ResolvedType {
        // Search in provided source file first
        if (sourceFile) {
            const found = this.searchInSourceFile(typeName, sourceFile)
            if (found) return found
        }

        // Search in all source files
        for (const file of this.sourceFiles) {
            const found = this.searchInSourceFile(typeName, file)
            if (found) return found
        }

        // Return unknown type if not found
        return {
            name: typeName,
            type: 'primitive',
            description: `Unknown type: ${typeName}`
        }
    }

    /**
     * Search for type in a specific source file
     */
    private searchInSourceFile(typeName: string, sourceFile: SourceFile): ResolvedType | null {
        // Search interfaces
        const interfaces = sourceFile.getInterfaces()
        for (const interfaceDecl of interfaces) {
            if (interfaceDecl.getName() === typeName) {
                return this.resolveInterface(interfaceDecl, sourceFile)
            }
        }

        // Search classes
        const classes = sourceFile.getClasses()
        for (const classDecl of classes) {
            if (classDecl.getName() === typeName) {
                return this.resolveClass(classDecl, sourceFile)
            }
        }

        // Search enums
        const enums = sourceFile.getEnums()
        for (const enumDecl of enums) {
            if (enumDecl.getName() === typeName) {
                return this.resolveEnum(enumDecl, sourceFile)
            }
        }

        return null
    }

    /**
     * Resolve interface declaration
     */
    private resolveInterface(interfaceDecl: InterfaceDeclaration, sourceFile: SourceFile): ResolvedType {
        const properties: PropertyInfo[] = []
        
        for (const property of interfaceDecl.getProperties()) {
            const typeNode = property.getTypeNode()
            const propertyType = typeNode ? this.resolveTypeNode(typeNode, sourceFile) : this.createPrimitiveType('any')
            properties.push({
                name: property.getName(),
                type: propertyType,
                optional: property.hasQuestionToken(),
                description: this.extractJSDocDescription(property)
            })
        }

        return {
            name: interfaceDecl.getName(),
            type: 'interface',
            properties,
            filePath: sourceFile.getFilePath(),
            description: this.extractJSDocDescription(interfaceDecl)
        }
    }

    /**
     * Resolve class declaration
     */
    private resolveClass(classDecl: ClassDeclaration, sourceFile: SourceFile): ResolvedType {
        const properties: PropertyInfo[] = []
        
        for (const property of classDecl.getProperties()) {
            const typeNode = property.getTypeNode()
            const propertyType = typeNode ? this.resolveTypeNode(typeNode, sourceFile) : this.createPrimitiveType('any')
            properties.push({
                name: property.getName(),
                type: propertyType,
                optional: property.hasQuestionToken(),
                description: this.extractJSDocDescription(property),
                defaultValue: property.getInitializer()?.getText()
            })
        }

        return {
            name: classDecl.getName() || 'AnonymousClass',
            type: 'class',
            properties,
            filePath: sourceFile.getFilePath(),
            description: this.extractJSDocDescription(classDecl)
        }
    }

    /**
     * Resolve enum declaration
     */
    private resolveEnum(enumDecl: any, sourceFile: SourceFile): ResolvedType {
        const properties: PropertyInfo[] = []
        
        for (const member of enumDecl.getMembers()) {
            properties.push({
                name: member.getName(),
                type: {
                    name: 'string | number',
                    type: 'union',
                    unionTypes: [
                        { name: 'string', type: 'primitive' },
                        { name: 'number', type: 'primitive' }
                    ]
                },
                optional: false,
                defaultValue: member.getValue()
            })
        }

        return {
            name: enumDecl.getName(),
            type: 'enum',
            properties,
            filePath: sourceFile.getFilePath(),
            description: this.extractJSDocDescription(enumDecl)
        }
    }

    /**
     * Extract JSDoc description from node
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
     * Clear type cache
     */
    clearCache(): void {
        this.typeCache.clear()
    }

    /**
     * Get cache statistics
     */
    getCacheStats(): { size: number; keys: string[] } {
        return {
            size: this.typeCache.size,
            keys: Array.from(this.typeCache.keys())
        }
    }
}
