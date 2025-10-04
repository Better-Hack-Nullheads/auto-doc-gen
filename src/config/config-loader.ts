import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { AutoDocGenAIConfig } from '../types/ai.types'

export interface AutoDocGenConfig {
    database: {
        type: 'mongodb'
        url: string
        database: string
    }
    json: {
        outputDir: string
        filename: string
        format: 'json' | 'json-pretty'
    }
    analysis: {
        includePrivate: boolean
        verbose: boolean
        colorOutput: boolean
    }
    ai: AutoDocGenAIConfig
}

export class ConfigLoader {
    private static readonly CONFIG_FILE = 'autodocgen.config.json'
    private static readonly DEFAULT_CONFIG: AutoDocGenConfig = {
        database: {
            type: 'mongodb',
            url: 'mongodb://localhost:27017/api_docs',
            database: 'api_docs',
        },
        json: {
            outputDir: './docs',
            filename: 'analysis.json',
            format: 'json-pretty',
        },
        analysis: {
            includePrivate: false,
            verbose: false,
            colorOutput: true,
        },
        ai: {
            enabled: true,
            provider: 'openai',
            model: 'gpt-4o',
            temperature: 0.7,
            maxTokens: 16000,
            outputDir: './docs',
            filename: 'ai-analysis.json',
            templates: {
                default: 'comprehensive',
                security: 'security-focused',
                performance: 'performance-focused',
            },
            providers: {
                google: {
                    models: [
                        'gemini-2.5-flash',
                        'gemini-2.5-pro',
                        'gemini-1.5-flash',
                    ],
                    defaultModel: 'gemini-2.5-flash',
                },
                openai: {
                    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'],
                    defaultModel: 'gpt-4o',
                },
                anthropic: {
                    models: [
                        'claude-3-5-sonnet',
                        'claude-3-haiku',
                        'claude-3-opus',
                    ],
                    defaultModel: 'claude-3-5-sonnet',
                },
            },
        },
    }

    /**
     * Load configuration from file or create default if not exists
     */
    static loadConfig(projectPath: string): AutoDocGenConfig {
        // Always look for config file in current working directory
        const currentDir = process.cwd()
        const configPath = join(currentDir, this.CONFIG_FILE)

        if (!existsSync(configPath)) {
            console.log(`📝 No config file found: ${this.CONFIG_FILE}`)
            console.log(
                `💡 Run 'auto-doc-gen config' to create a default configuration file`
            )
            return this.DEFAULT_CONFIG
        }

        try {
            const configContent = readFileSync(configPath, 'utf8')
            const userConfig = JSON.parse(configContent)

            // Merge with defaults to ensure all properties exist
            return this.mergeWithDefaults(userConfig)
        } catch (error) {
            console.warn(`⚠️  Could not read config file: ${configPath}`)
            console.log('📝 Using default configuration')
            return this.DEFAULT_CONFIG
        }
    }

    /**
     * Create default configuration file with environment variable examples
     */
    static createDefaultConfig(configPath: string): void {
        const configWithComments = {
            '// AutoDocGen Configuration File':
                'Edit this file to customize settings',
            '// Environment Variables':
                'You can also use environment variables to override these settings',
            '// Database Environment Variables': [
                'AUTODOCGEN_DB_TYPE - Database type (default: mongodb)',
                'AUTODOCGEN_DB_URL - Database connection URL',
                'AUTODOCGEN_DB_NAME - Database name',
            ],
            '// JSON Export Environment Variables': [
                'AUTODOCGEN_OUTPUT_DIR - Output directory for JSON files',
                'AUTODOCGEN_FILENAME - Default filename for exports',
                'AUTODOCGEN_FORMAT - Output format (json or json-pretty)',
            ],
            '// Analysis Environment Variables': [
                'AUTODOCGEN_INCLUDE_PRIVATE - Include private methods (true/false)',
                'AUTODOCGEN_VERBOSE - Show verbose output (true/false)',
                'AUTODOCGEN_COLOR_OUTPUT - Enable colored output (true/false)',
            ],
            '// Priority':
                'CLI options > Environment variables > Config file > Defaults',
            ...this.DEFAULT_CONFIG,
        }

        const configContent = JSON.stringify(configWithComments, null, 2)
        writeFileSync(configPath, configContent, 'utf8')
    }

    /**
     * Merge user config with defaults and environment variables
     */
    private static mergeWithDefaults(userConfig: any): AutoDocGenConfig {
        return {
            database: {
                type:
                    this.getEnvOrConfig(
                        'AUTODOCGEN_DB_TYPE',
                        userConfig.database?.type
                    ) || this.DEFAULT_CONFIG.database.type,
                url:
                    this.getEnvOrConfig(
                        'AUTODOCGEN_DB_URL',
                        userConfig.database?.url
                    ) || this.DEFAULT_CONFIG.database.url,
                database:
                    this.getEnvOrConfig(
                        'AUTODOCGEN_DB_NAME',
                        userConfig.database?.database
                    ) || this.DEFAULT_CONFIG.database.database,
            },
            json: {
                outputDir:
                    this.getEnvOrConfig(
                        'AUTODOCGEN_OUTPUT_DIR',
                        userConfig.json?.outputDir
                    ) || this.DEFAULT_CONFIG.json.outputDir,
                filename:
                    this.getEnvOrConfig(
                        'AUTODOCGEN_FILENAME',
                        userConfig.json?.filename
                    ) || this.DEFAULT_CONFIG.json.filename,
                format:
                    this.getEnvOrConfig(
                        'AUTODOCGEN_FORMAT',
                        userConfig.json?.format
                    ) || this.DEFAULT_CONFIG.json.format,
            },
            analysis: {
                includePrivate:
                    this.getEnvOrConfig(
                        'AUTODOCGEN_INCLUDE_PRIVATE',
                        userConfig.analysis?.includePrivate
                    ) ?? this.DEFAULT_CONFIG.analysis.includePrivate,
                verbose:
                    this.getEnvOrConfig(
                        'AUTODOCGEN_VERBOSE',
                        userConfig.analysis?.verbose
                    ) ?? this.DEFAULT_CONFIG.analysis.verbose,
                colorOutput:
                    this.getEnvOrConfig(
                        'AUTODOCGEN_COLOR_OUTPUT',
                        userConfig.analysis?.colorOutput
                    ) ?? this.DEFAULT_CONFIG.analysis.colorOutput,
            },
            ai: {
                enabled:
                    this.getEnvOrConfig(
                        'AUTODOCGEN_AI_ENABLED',
                        userConfig.ai?.enabled
                    ) ?? this.DEFAULT_CONFIG.ai.enabled,
                provider:
                    this.getEnvOrConfig(
                        'AUTODOCGEN_AI_PROVIDER',
                        userConfig.ai?.provider
                    ) || this.DEFAULT_CONFIG.ai.provider,
                model:
                    this.getEnvOrConfig(
                        'AUTODOCGEN_AI_MODEL',
                        userConfig.ai?.model
                    ) || this.DEFAULT_CONFIG.ai.model,
                apiKey:
                    this.getEnvOrConfig(
                        this.getApiKeyEnvVar(
                            userConfig.ai?.provider ||
                                this.DEFAULT_CONFIG.ai.provider
                        ),
                        userConfig.ai?.apiKey
                    ) || this.DEFAULT_CONFIG.ai.apiKey,
                temperature:
                    this.getEnvOrConfig(
                        'AUTODOCGEN_AI_TEMPERATURE',
                        userConfig.ai?.temperature
                    ) ?? this.DEFAULT_CONFIG.ai.temperature,
                maxTokens:
                    this.getEnvOrConfig(
                        'AUTODOCGEN_AI_MAX_TOKENS',
                        userConfig.ai?.maxTokens
                    ) ?? this.DEFAULT_CONFIG.ai.maxTokens,
                outputDir:
                    this.getEnvOrConfig(
                        'AUTODOCGEN_AI_OUTPUT_DIR',
                        userConfig.ai?.outputDir
                    ) || this.DEFAULT_CONFIG.ai.outputDir,
                filename:
                    this.getEnvOrConfig(
                        'AUTODOCGEN_AI_FILENAME',
                        userConfig.ai?.filename
                    ) || this.DEFAULT_CONFIG.ai.filename,
                templates:
                    userConfig.ai?.templates ||
                    this.DEFAULT_CONFIG.ai.templates,
                providers:
                    userConfig.ai?.providers ||
                    this.DEFAULT_CONFIG.ai.providers,
            },
        }
    }

    /**
     * Get value from environment variable or config, with type conversion
     */
    private static getEnvOrConfig(envVar: string, configValue: any): any {
        const envValue = process.env[envVar]

        if (envValue === undefined) {
            return configValue
        }

        // Convert string environment variables to appropriate types
        if (envValue === 'true') return true
        if (envValue === 'false') return false
        if (envValue === 'null') return null

        // Try to parse as number
        const numValue = Number(envValue)
        if (!isNaN(numValue) && envValue !== '') {
            return numValue
        }

        return envValue
    }

    /**
     * Get the correct API key environment variable name for the provider
     */
    private static getApiKeyEnvVar(provider: string): string {
        switch (provider) {
            case 'google':
                return 'GOOGLE_AI_API_KEY'
            case 'openai':
                return 'OPENAI_API_KEY'
            case 'anthropic':
                return 'ANTHROPIC_API_KEY'
            default:
                return 'GOOGLE_AI_API_KEY'
        }
    }

    /**
     * Extract database name from URL
     */
    static extractDatabaseName(url: string): string {
        try {
            const urlObj = new URL(url)
            const pathname = urlObj.pathname
            return pathname.startsWith('/')
                ? pathname.slice(1)
                : pathname || 'api_docs'
        } catch {
            return 'api_docs'
        }
    }
}
