import { ResolvedType } from '../core/type-resolver'

export interface EnhancedApiEndpoint {
    method: string
    path: string
    fullPath: string
    summary: string
    description?: string
    requestSchema?: JsonSchema
    responseSchema?: JsonSchema
    parameters: ParameterSchema[]
    validationRules: ValidationRule[]
    examples: RequestResponseExample[]
    statusCodes: StatusCodeInfo[]
    tags?: string[]
}

export interface JsonSchema {
    type: string
    properties?: Record<string, PropertySchema>
    required?: string[]
    items?: JsonSchema
    enum?: any[]
    format?: string
    description?: string
    examples?: any[]
    additionalProperties?: boolean
}

export interface PropertySchema {
    type: string
    description?: string
    optional?: boolean
    format?: string
    enum?: any[]
    items?: JsonSchema
    properties?: Record<string, PropertySchema>
    required?: string[]
    examples?: any[]
    validationRules?: ValidationRule[]
}

export interface ParameterSchema {
    name: string
    type: string
    location: 'path' | 'query' | 'body' | 'header'
    required: boolean
    description?: string
    validationRules: ValidationRule[]
    schema?: JsonSchema
}

export interface RequestResponseExample {
    name: string
    description?: string
    request?: any
    response?: any
    statusCode?: number
}

export interface StatusCodeInfo {
    code: number
    description: string
    schema?: JsonSchema
}

export interface ValidationRule {
    field: string
    rule: string
    message?: string
    parameters?: any[]
    value?: any
}

export interface EnhancedControllerInfo {
    name: string
    filePath: string
    basePath?: string
    endpoints: EnhancedApiEndpoint[]
    decorators: string[]
    imports: ImportInfo[]
    dependencies: string[]
}

export interface ImportInfo {
    name: string
    from: string
    isDefault: boolean
    isNamespace: boolean
}

export interface TypeSchema {
    [typeName: string]: ResolvedType
}

export interface EnhancedAnalysisResult {
    metadata: AnalysisMetadata
    apiEndpoints: EnhancedControllerInfo[]
    typeSchemas: TypeSchema
    summary: AnalysisSummary
}

export interface AnalysisMetadata {
    generatedAt: string
    version: string
    projectPath: string
    analysisTime: number
    totalFiles: number
    totalControllers: number
    totalServices: number
    totalEndpoints: number
    totalTypes: number
}

export interface AnalysisSummary {
    controllers: number
    services: number
    totalEndpoints: number
    totalTypes: number
    totalDtos: number
    totalInterfaces: number
    analysisTime: number
}

export interface HttpMethodInfo {
    method: string
    decorator: string
    defaultPath?: string
}

export interface RouteInfo {
    path: string
    parameters: RouteParameter[]
    isDynamic: boolean
}

export interface RouteParameter {
    name: string
    type: string
    required: boolean
    decorator: string
}

// HTTP method mapping
export const HTTP_METHODS: Record<string, HttpMethodInfo> = {
    'Get': { method: 'GET', decorator: 'Get' },
    'Post': { method: 'POST', decorator: 'Post' },
    'Put': { method: 'PUT', decorator: 'Put' },
    'Patch': { method: 'PATCH', decorator: 'Patch' },
    'Delete': { method: 'DELETE', decorator: 'Delete' },
    'Options': { method: 'OPTIONS', decorator: 'Options' },
    'Head': { method: 'HEAD', decorator: 'Head' },
    'All': { method: 'ALL', decorator: 'All' }
}

// Parameter decorator mapping
export const PARAMETER_DECORATORS: Record<string, string> = {
    'Body': 'body',
    'Param': 'path',
    'Query': 'query',
    'Headers': 'header',
    'Req': 'request',
    'Res': 'response'
}
