import { ControllerInfo } from './controller.types'
import { ServiceInfo } from './service.types'

export interface JsonOutputOptions {
    outputPath?: string
    format?: 'json' | 'json-pretty'
    includeMetadata?: boolean
    groupBy?: 'file' | 'type' | 'none'
    timestamp?: boolean
}

export interface AnalysisMetadata {
    generatedAt: string
    version: string
    projectPath: string
    analysisTime: number
    totalFiles: number
    totalControllers: number
    totalServices: number
    totalMethods: number
    totalTypes: number
}

export interface JsonAnalysisResult {
    metadata: AnalysisMetadata
    controllers: ControllerInfo[]
    services: ServiceInfo[]
    types: ExtractedType[]
    summary: {
        controllers: number
        services: number
        totalMethods: number
        totalTypes: number
        totalDtos: number
        totalInterfaces: number
        analysisTime: number
    }
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

export interface ImportInfo {
    name: string
    from: string
    isDefault: boolean
    isNamespace: boolean
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
