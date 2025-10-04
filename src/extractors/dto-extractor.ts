import { ClassDeclaration, PropertyDeclaration, SourceFile } from 'ts-morph'
import { ExtractedType, ValidationRule } from '../types/type-extraction.types'

export class DtoExtractor {
    static extractDtoInfo(sourceFile: SourceFile): ExtractedType[] {
        const dtos: ExtractedType[] = []
        const classes = sourceFile.getClasses()

        for (const classDecl of classes) {
            // Check if this looks like a DTO (has validation decorators or is in dto folder)
            if (this.isDto(classDecl, sourceFile)) {
                dtos.push({
                    name: classDecl.getName() || 'AnonymousDto',
                    type: 'class',
                    filePath: sourceFile.getFilePath(),
                    definition: `export class ${classDecl.getName()}`,
                    properties: this.extractDtoProperties(classDecl),
                    decorators: classDecl
                        .getDecorators()
                        .map((d) => d.getName()),
                    imports: this.extractImports(sourceFile),
                    exports: [classDecl.getName() || 'AnonymousDto'],
                    dependencies: this.extractDependencies(classDecl),
                    validationRules:
                        this.extractClassValidationRules(classDecl),
                })
            }
        }

        return dtos
    }

    static extractValidationDecorators(
        property: PropertyDeclaration
    ): ValidationRule[] {
        const decorators = property.getDecorators()
        return decorators.map((decorator) => ({
            decorator: decorator.getName(),
            parameters: decorator.getArguments().map((arg) => arg.getText()),
            message: this.extractValidationMessage(decorator),
        }))
    }

    private static isDto(
        classDecl: ClassDeclaration,
        sourceFile: SourceFile
    ): boolean {
        // Check if file path contains 'dto'
        const filePath = sourceFile.getFilePath().toLowerCase()
        if (filePath.includes('dto')) {
            return true
        }

        // Check if class has validation decorators on properties
        const properties = classDecl.getProperties()
        for (const property of properties) {
            const decorators = property.getDecorators()
            for (const decorator of decorators) {
                const decoratorName = decorator.getName()
                if (this.isValidationDecorator(decoratorName)) {
                    return true
                }
            }
        }

        return false
    }

    private static isValidationDecorator(decoratorName: string): boolean {
        const validationDecorators = [
            'IsString',
            'IsNumber',
            'IsBoolean',
            'IsArray',
            'IsObject',
            'IsNotEmpty',
            'IsOptional',
            'IsEmail',
            'IsUrl',
            'IsDate',
            'IsEnum',
            'IsUUID',
            'IsInt',
            'IsFloat',
            'IsDecimal',
            'Min',
            'Max',
            'MinLength',
            'MaxLength',
            'Matches',
            'IsAlpha',
            'IsAlphanumeric',
            'IsNumeric',
            'IsBase64',
            'IsJWT',
            'IsMongoId',
            'IsISO8601',
            'IsPhoneNumber',
        ]
        return validationDecorators.includes(decoratorName)
    }

    private static extractDtoProperties(classDecl: ClassDeclaration): any[] {
        const properties: any[] = []
        const propertyDeclarations = classDecl.getProperties()

        for (const property of propertyDeclarations) {
            properties.push({
                name: property.getName(),
                type: this.extractPropertyType(property),
                optional: property.hasQuestionToken(),
                decorators: property.getDecorators().map((d) => d.getName()),
                validationRules: this.extractValidationDecorators(property),
                defaultValue: property.getInitializer()?.getText(),
            })
        }

        return properties
    }

    private static extractPropertyType(property: PropertyDeclaration): string {
        const typeNode = property.getTypeNode()
        if (typeNode) {
            return typeNode.getText()
        }

        try {
            const type = property.getType()
            return type.getText()
        } catch {
            return 'any'
        }
    }

    private static extractValidationMessage(
        decorator: any
    ): string | undefined {
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

    private static extractImports(sourceFile: SourceFile): any[] {
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
                    isNamespace: false,
                })
            }

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

    private static extractDependencies(classDecl: ClassDeclaration): string[] {
        const dependencies: string[] = []
        const properties = classDecl.getProperties()

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

        return [...new Set(dependencies)]
    }

    private static extractClassValidationRules(
        classDecl: ClassDeclaration
    ): ValidationRule[] {
        const decorators = classDecl.getDecorators()
        return decorators.map((decorator) => ({
            decorator: decorator.getName(),
            parameters: decorator.getArguments().map((arg) => arg.getText()),
            message: undefined,
        }))
    }
}
