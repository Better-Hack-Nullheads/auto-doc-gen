// Database entity types for AutoDocGen
export interface DocumentationEntity {
    _id?: string
    title: string
    description: string
    version: string
    createdAt: Date
    updatedAt: Date
    endpointIds: string[]
}

export interface EndpointEntity {
    _id?: string
    path: string
    method: string
    parameters: ParameterEntity[]
    request: string
    response: string
    codeExamples: CodeExampleEntity[]
    documentationId: string
    controllerName: string
    summary: string
    tags: string[]
}

export interface ParameterEntity {
    name: string
    location: string // 'query' | 'header' | 'path' | 'body'
    required: boolean
    description: string
    type: string
}

export interface CodeExampleEntity {
    language: string
    code: string
}

export interface TypeSchemaEntity {
    _id?: string
    name: string
    type: string
    definition: string
    properties: PropertyEntity[]
    validationRules: ValidationRuleEntity[]
    documentationId: string
}

export interface PropertyEntity {
    name: string
    type: string
    optional: boolean
    decorators: string[]
    validationRules: ValidationRuleEntity[]
}

export interface ValidationRuleEntity {
    decorator: string
    parameters: any[]
    message?: string
}

// Database configuration
export interface DatabaseConfig {
    type: 'mongodb' | 'postgresql' | 'mysql'
    connectionString: string
    database: string
    mapping: {
        enabled: boolean
        createCollections: boolean
        includeTypeSchemas: boolean
        includeValidationRules: boolean
    }
    collections: {
        documentation: string
        endpoints: string
        types: string
    }
}

// Database adapter interface
export interface DatabaseAdapter {
    connect(): Promise<void>
    createCollections(): Promise<void>
    insertDocumentation(doc: DocumentationEntity): Promise<string>
    insertEndpoints(endpoints: EndpointEntity[]): Promise<string[]>
    insertTypeSchemas(schemas: TypeSchemaEntity[]): Promise<void>
    close(): Promise<void>
}
