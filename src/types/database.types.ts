// Database types for AutoDocGen

export interface DatabaseConfig {
    type: 'mongodb'
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

export interface DocumentationRecord {
    content: string
    source: string
    provider: string
    model: string
    timestamp: string
    metadata: {
        temperature: number
        maxTokens: number
    }
    createdAt: Date
    updatedAt: Date
}
