// Common types for AutoDocGen

export interface SimpleOptions {
    verbose: boolean
    colorOutput: boolean
    includePrivate?: boolean
}

export interface AnalysisOptions {
    includeInterfaces?: boolean
    includeClasses?: boolean
    includeEnums?: boolean
    includeValidationRules?: boolean
    includeDecorators?: boolean
    includeImports?: boolean
    maxDepth?: number
}

export interface ExportOptions {
    outputPath: string
    format: 'json' | 'json-pretty'
    includeMetadata?: boolean
    timestamp?: boolean
}
