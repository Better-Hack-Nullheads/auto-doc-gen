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

    static createDefaultConfig(): DatabaseConfig | null {
        // No default config - user must provide database URL
        return null
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
