// Simplified database configuration for AutoDocGen
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
