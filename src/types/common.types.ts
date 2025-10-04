export interface SimpleOptions {
    verbose?: boolean // Show detailed information
    includePrivate?: boolean // Include private methods
    colorOutput?: boolean // Use colored console output
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
