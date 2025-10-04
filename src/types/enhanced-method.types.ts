import { MethodInfo } from './common.types'

export interface EnhancedMethodInfo extends MethodInfo {
    httpMethod?: string
    route?: string
    fullRoute?: string
    description?: string
    tags?: string[]
    requestBody?: any
    responseType?: string
    statusCodes?: number[]
    inputTypes?: TypeInfo[]
    outputTypes?: TypeInfo[]
    validationRules?: ValidationRule[]
}

export interface TypeInfo {
    name: string
    type: string
    filePath?: string
    properties?: PropertyInfo[]
    isInterface: boolean
    isClass: boolean
    isEnum: boolean
    isGeneric: boolean
    genericTypes?: string[]
    extends?: string[]
    implements?: string[]
    decorators?: string[]
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
