export interface TypeExtractionOptions {
    includeInterfaces?: boolean
    includeClasses?: boolean
    includeEnums?: boolean
    includeGenerics?: boolean
    includeValidationRules?: boolean
    includeDecorators?: boolean
    includeImports?: boolean
    maxDepth?: number
}

export interface ExtractedType {
    name: string
    type: 'interface' | 'class' | 'enum' | 'type-alias'
    filePath: string
    definition: string
    properties: PropertyInfo[]
    methods?: MethodInfo[]
    decorators: string[]
    imports: ImportInfo[]
    exports: string[]
    dependencies: string[]
    validationRules?: ValidationRule[]
}

export interface ImportInfo {
    name: string
    from: string
    isDefault: boolean
    isNamespace: boolean
}

export interface PropertyInfo {
    name: string
    type: string
    optional: boolean
    decorators?: string[]
    validationRules?: ValidationRule[]
    defaultValue?: any
}

export interface ValidationRule {
    decorator: string
    parameters?: any[]
    message?: string
}

export interface MethodInfo {
    name: string
    parameters: ParameterInfo[]
    returnType: string
    decorators: string[]
    isPublic: boolean
}

export interface ParameterInfo {
    name: string
    type: string
    decorator?: string
    optional: boolean
}
