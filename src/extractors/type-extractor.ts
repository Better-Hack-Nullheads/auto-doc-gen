import {
    ClassDeclaration,
    EnumDeclaration,
    InterfaceDeclaration,
    Project,
    PropertyDeclaration,
    SourceFile,
} from 'ts-morph'

export interface ExtractedType {
    name: string
    type: 'interface' | 'class' | 'enum' | 'type-alias'
    filePath: string
    properties?: any[]
    methods?: any[]
}

export class TypeExtractor {
    private project: Project

    constructor(project: Project) {
        this.project = project
    }

    extractAllTypes(sourceFiles: SourceFile[]): ExtractedType[] {
        const types: ExtractedType[] = []

        for (const sourceFile of sourceFiles) {
            // Extract interfaces
            types.push(...this.extractInterfaces(sourceFile))

            // Extract classes (DTOs, etc.)
            types.push(...this.extractClasses(sourceFile))

            // Extract enums
            types.push(...this.extractEnums(sourceFile))
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
                properties: this.extractProperties(interfaceDecl),
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
                properties: this.extractProperties(classDecl),
                methods: this.extractMethods(classDecl),
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
                properties: this.extractEnumMembers(enumDecl),
            })
        }

        return enums
    }

    private extractProperties(
        classOrInterface: ClassDeclaration | InterfaceDeclaration
    ): any[] {
        const properties: any[] = []
        const propertyDeclarations = classOrInterface.getProperties()

        for (const property of propertyDeclarations) {
            properties.push({
                name: property.getName(),
                type: this.extractPropertyType(property),
                optional: property.hasQuestionToken(),
            })
        }

        return properties
    }

    private extractEnumMembers(enumDecl: EnumDeclaration): any[] {
        const members: any[] = []
        const enumMembers = enumDecl.getMembers()

        for (const member of enumMembers) {
            members.push({
                name: member.getName(),
                type: 'string | number',
                optional: false,
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
            })
        }

        return methods
    }
}
