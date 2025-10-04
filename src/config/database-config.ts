import { existsSync, readFileSync } from 'fs'
import { DatabaseConfig } from '../types/database.types'

export class DatabaseConfigLoader {
    static loadFromFile(configPath: string): DatabaseConfig | null {
        try {
            if (!existsSync(configPath)) return null

            const configContent = readFileSync(configPath, 'utf8')
            const config = JSON.parse(configContent)

            return this.validateConfig(config.database)
        } catch (error) {
            console.log(`⚠️  Could not load database config: ${configPath}`)
            return null
        }
    }

    static createDefaultConfig(): DatabaseConfig {
        return {
            type: 'mongodb',
            connectionString: 'mongodb://localhost:27017/api_docs',
            database: 'api_docs',
            mapping: {
                enabled: true,
                createCollections: true,
                includeTypeSchemas: true,
                includeValidationRules: true,
            },
            collections: {
                documentation: 'documentation',
                endpoints: 'endpoints',
                types: 'type_schemas',
            },
        }
    }

    private static validateConfig(config: any): DatabaseConfig | null {
        if (!config || !config.type || !config.connectionString) {
            return null
        }

        return {
            type: config.type,
            connectionString: config.connectionString,
            database: config.database || 'api_docs',
            mapping: {
                enabled: config.mapping?.enabled ?? true,
                createCollections: config.mapping?.createCollections ?? true,
                includeTypeSchemas: config.mapping?.includeTypeSchemas ?? true,
                includeValidationRules:
                    config.mapping?.includeValidationRules ?? true,
            },
            collections: {
                documentation:
                    config.collections?.documentation || 'documentation',
                endpoints: config.collections?.endpoints || 'endpoints',
                types: config.collections?.types || 'type_schemas',
            },
        }
    }
}
