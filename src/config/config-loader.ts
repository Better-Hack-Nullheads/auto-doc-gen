import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

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
     * Create default configuration file
     */
    static createDefaultConfig(configPath: string): void {
        const configContent = JSON.stringify(this.DEFAULT_CONFIG, null, 2)
        writeFileSync(configPath, configContent, 'utf8')
    }

    /**
     * Merge user config with defaults
     */
    private static mergeWithDefaults(userConfig: any): AutoDocGenConfig {
        return {
            database: {
                type:
                    userConfig.database?.type ||
                    this.DEFAULT_CONFIG.database.type,
                url:
                    userConfig.database?.url ||
                    this.DEFAULT_CONFIG.database.url,
                database:
                    userConfig.database?.database ||
                    this.DEFAULT_CONFIG.database.database,
            },
            json: {
                outputDir:
                    userConfig.json?.outputDir ||
                    this.DEFAULT_CONFIG.json.outputDir,
                filename:
                    userConfig.json?.filename ||
                    this.DEFAULT_CONFIG.json.filename,
                format:
                    userConfig.json?.format || this.DEFAULT_CONFIG.json.format,
            },
            analysis: {
                includePrivate:
                    userConfig.analysis?.includePrivate ??
                    this.DEFAULT_CONFIG.analysis.includePrivate,
                verbose:
                    userConfig.analysis?.verbose ??
                    this.DEFAULT_CONFIG.analysis.verbose,
                colorOutput:
                    userConfig.analysis?.colorOutput ??
                    this.DEFAULT_CONFIG.analysis.colorOutput,
            },
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
