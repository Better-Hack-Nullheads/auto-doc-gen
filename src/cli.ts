#!/usr/bin/env node

import { Command } from 'commander'
import { config } from 'dotenv'
import * as fs from 'fs'
import { existsSync } from 'fs'
import { join } from 'path'
import { MongoDBAdapter } from './adapters/mongodb-adapter'
import { ConfigLoader } from './config/config-loader'
import { AIService } from './services/ai-service'

// Load environment variables from .env file
config()

const program = new Command()

program
    .name('auto-doc-gen')
    .description('Simple AI-powered documentation generator')
    .version('1.0.0')

// Command 1: Generate Configuration
program
    .command('config')
    .description('Generate default configuration file')
    .option('-f, --force', 'Overwrite existing config file', false)
    .action(async (options: any) => {
        try {
            const currentDir = process.cwd()
            const configPath = join(currentDir, 'autodocgen.config.json')

            if (existsSync(configPath) && !options.force) {
                console.log(
                    '📝 Configuration file already exists: autodocgen.config.json'
                )
                console.log('💡 Use --force to overwrite existing config file')
                return
            }

            ConfigLoader.createDefaultConfig(configPath)
            console.log(
                '✅ Created default config file: autodocgen.config.json'
            )
            console.log('📝 Edit autodocgen.config.json to customize settings')
            console.log('🚀 You can now run: auto-doc-gen ai <json-file>')
        } catch (error) {
            console.error('❌ Config generation failed:', error)
            process.exit(1)
        }
    })

// Command 2: AI Analysis (Core Command)
program
    .command('ai')
    .description('Generate AI documentation from JSON input')
    .argument('<json-file>', 'Path to JSON file containing project data')
    .option(
        '--provider <provider>',
        'AI provider (google, openai, anthropic)',
        'google'
    )
    .option('--model <model>', 'AI model to use')
    .option('--api-key <key>', 'AI API key (overrides config)')
    .option('--temperature <temp>', 'AI temperature (0.0-1.0)', '0.7')
    .option('--max-tokens <tokens>', 'Maximum tokens for response', '4000')
    .option('--output <path>', 'Output file path for AI analysis')
    .option('--save-to-db', 'Save generated documentation to database')
    .option('-v, --verbose', 'Show verbose output')
    .action(async (jsonFile: string, options: any) => {
        try {
            // Check if JSON file exists
            if (!existsSync(jsonFile)) {
                console.error(`❌ JSON file not found: ${jsonFile}`)
                process.exit(1)
            }

            // Load configuration
            const config = ConfigLoader.loadConfig(process.cwd())

            // Check if AI is enabled
            if (!config.ai.enabled) {
                console.error('❌ AI analysis is disabled in configuration')
                console.log(
                    '💡 Enable AI in autodocgen.config.json or use --api-key option'
                )
                process.exit(1)
            }

            // Get API key from options or config
            const provider = options.provider || config.ai.provider
            const apiKeyEnvVar = getApiKeyEnvVar(provider)

            if (options.verbose) {
                console.log(`🔍 Debug Info:`)
                console.log(`   Provider: ${provider}`)
                console.log(`   Looking for env var: ${apiKeyEnvVar}`)
                console.log(
                    `   Env var value: ${
                        process.env[apiKeyEnvVar] ? 'SET' : 'NOT SET'
                    }`
                )
                console.log(
                    `   Config API key: ${config.ai.apiKey ? 'SET' : 'NOT SET'}`
                )
                console.log(
                    `   CLI API key: ${options.apiKey ? 'SET' : 'NOT SET'}`
                )
            }

            const apiKey =
                options.apiKey || config.ai.apiKey || process.env[apiKeyEnvVar]

            if (!apiKey) {
                console.error('❌ AI API key required!')
                console.log('💡 Options:')
                console.log('   1. Add ai.apiKey to autodocgen.config.json')
                console.log(`   2. Set ${apiKeyEnvVar} environment variable`)
                console.log(
                    '   3. Use --api-key option: --api-key "your-api-key"'
                )
                process.exit(1)
            }

            // Determine provider and model
            const model = options.model || config.ai.model

            // Validate provider
            const availableProviders = AIService.getAvailableProviders()
            if (!availableProviders.includes(provider)) {
                console.error(`❌ Invalid provider: ${provider}`)
                console.log(
                    `💡 Available providers: ${availableProviders.join(', ')}`
                )
                process.exit(1)
            }

            // Validate model
            const availableModels = AIService.getAvailableModels(provider)
            if (!availableModels.includes(model)) {
                console.error(`❌ Invalid model: ${model}`)
                console.log(
                    `💡 Available models for ${provider}: ${availableModels.join(
                        ', '
                    )}`
                )
                process.exit(1)
            }

            console.log(`🤖 Starting AI analysis with ${provider}/${model}...`)

            // Read JSON data
            const analysisData = JSON.parse(fs.readFileSync(jsonFile, 'utf8'))

            // Create AI service
            const aiConfig = {
                provider: provider as 'google' | 'openai' | 'anthropic',
                model,
                apiKey,
                temperature:
                    parseFloat(options.temperature) || config.ai.temperature,
                maxTokens: parseInt(options.maxTokens) || config.ai.maxTokens,
            }

            const aiService = new AIService(aiConfig)

            console.log('🧠 Processing with AI...')
            const aiAnalysis = await aiService.analyzeProject(analysisData)

            // Output results
            const outputPath =
                options.output || `${config.ai.outputDir}/ai-analysis.md`

            // Ensure output directory exists
            const outputDir = join(process.cwd(), config.ai.outputDir)
            if (!existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true })
            }

            // Write AI analysis to file
            fs.writeFileSync(outputPath, aiAnalysis)

            console.log('✅ AI analysis completed!')
            console.log(`📄 Results saved to: ${outputPath}`)
            console.log(
                `📝 Generated ${aiAnalysis.length} characters of analysis`
            )

            // Save to database if requested
            if (options.saveToDb) {
                try {
                    const dbUrl = config.database.url
                    if (!dbUrl) {
                        console.error(
                            '❌ Database URL required for saving to database!'
                        )
                        console.log(
                            '💡 Add database.url to autodocgen.config.json'
                        )
                        return
                    }

                    const dbConfig = {
                        type: config.database.type,
                        connectionString: dbUrl,
                        database: ConfigLoader.extractDatabaseName(dbUrl),
                        mapping: {
                            enabled: true,
                            createCollections: true,
                            includeTypeSchemas: true,
                            includeValidationRules: true,
                        },
                        collections: {
                            documentation: 'documentation',
                            endpoints: 'endpoints',
                            types: 'types',
                        },
                    }

                    const adapter = new MongoDBAdapter(dbConfig)
                    await adapter.connect()
                    await adapter.createCollections()

                    // Save the MD content to database
                    const docData = {
                        content: aiAnalysis,
                        source: jsonFile,
                        provider: provider,
                        model: model,
                        timestamp: new Date().toISOString(),
                        metadata: {
                            temperature:
                                parseFloat(options.temperature) ||
                                config.ai.temperature,
                            maxTokens:
                                parseInt(options.maxTokens) ||
                                config.ai.maxTokens,
                        },
                    }

                    await adapter.saveDocumentation(docData)
                    await adapter.close()

                    console.log('✅ Documentation saved to database')
                } catch (dbError) {
                    console.error('❌ Database save failed:', dbError)
                }
            }
        } catch (error) {
            console.error('❌ AI analysis failed:', error)
            process.exit(1)
        }
    })

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error)
    process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason)
    process.exit(1)
})

/**
 * Get the correct API key environment variable name for the provider
 */
function getApiKeyEnvVar(provider: string): string {
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

// Parse command line arguments
program.parse()
