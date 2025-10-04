#!/usr/bin/env node

import { Command } from 'commander'
import { config } from 'dotenv'
import * as fs from 'fs'
import { existsSync } from 'fs'
import { join } from 'path'
import { MongoDBAdapter } from './adapters/mongodb-adapter'
import { ConfigLoader } from './config/config-loader'
import { AutoDocGen } from './core/analyzer'
import { AIService } from './services/ai-service'
import { SimpleOptions } from './types/common.types'
import { PromptTemplates } from './utils/prompt-templates'

// Load environment variables from .env file
config()

const program = new Command()

program
    .name('auto-doc-gen')
    .description('Simple NestJS controller and service analyzer')
    .version('1.0.0')

// Command 0: Generate Configuration
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
            console.log('🚀 You can now run: auto-doc-gen analyze src')
        } catch (error) {
            console.error('❌ Config generation failed:', error)
            process.exit(1)
        }
    })

// Command 1: Console Analysis
program
    .command('analyze')
    .description(
        'Analyze NestJS project and display controllers and services in console'
    )
    .argument('<path>', 'Path to the NestJS project source directory')
    .option('-v, --verbose', 'Show verbose output (overrides config)')
    .option('--no-color', 'Disable colored output (overrides config)')
    .option('--include-private', 'Include private methods (overrides config)')
    .action(async (path: string, options: any) => {
        try {
            // Load configuration
            const config = ConfigLoader.loadConfig(path)

            const analyzerOptions: SimpleOptions = {
                verbose:
                    options.verbose !== undefined
                        ? options.verbose
                        : config.analysis.verbose,
                colorOutput:
                    options.color !== undefined
                        ? options.color
                        : config.analysis.colorOutput,
                includePrivate:
                    options.includePrivate !== undefined
                        ? options.includePrivate
                        : config.analysis.includePrivate,
            }

            const analyzer = new AutoDocGen(analyzerOptions)
            await analyzer.analyze(path)
        } catch (error) {
            console.error('❌ Analysis failed:', error)
            process.exit(1)
        }
    })

// Command 2: JSON Export
program
    .command('export')
    .description('Export analysis results to JSON file')
    .argument('<path>', 'Path to the NestJS project source directory')
    .option('-o, --output <path>', 'Output file path (overrides config)')
    .option('-v, --verbose', 'Show verbose output (overrides config)')
    .action(async (path: string, options: any) => {
        try {
            // Load configuration
            const config = ConfigLoader.loadConfig(path)

            const analyzer = new AutoDocGen({
                verbose:
                    options.verbose !== undefined
                        ? options.verbose
                        : config.analysis.verbose,
                colorOutput: config.analysis.colorOutput,
            })

            // Use config or override with CLI option
            const outputPath =
                options.output ||
                `${config.json.outputDir}/${config.json.filename}`

            const outputPathResult = await analyzer.exportToJson(path, {
                outputPath: outputPath,
                format: config.json.format,
                includeMetadata: true,
                timestamp: true,
            })

            console.log(`✅ JSON exported to: ${outputPathResult}`)
        } catch (error) {
            console.error('❌ Export failed:', error)
            process.exit(1)
        }
    })

// Command 3: Database Save
program
    .command('save')
    .description('Save analysis results to MongoDB database')
    .argument('<path>', 'Path to the NestJS project source directory')
    .option('--db-url <url>', 'MongoDB connection URL (overrides config)')
    .option('-v, --verbose', 'Show verbose output (overrides config)')
    .action(async (path: string, options: any) => {
        try {
            // Load configuration
            const config = ConfigLoader.loadConfig(path)

            // Use config or CLI option for database URL
            const dbUrl = options.dbUrl || config.database.url

            if (!dbUrl) {
                console.error('❌ Database URL required!')
                console.log('💡 Options:')
                console.log('   1. Add database.url to autodocgen.config.json')
                console.log(
                    '   2. Use --db-url option: --db-url "mongodb://localhost:27017/your_db"'
                )
                process.exit(1)
            }

            const analyzer = new AutoDocGen({
                verbose:
                    options.verbose !== undefined
                        ? options.verbose
                        : config.analysis.verbose,
                colorOutput: config.analysis.colorOutput,
            })

            // First export to JSON
            const tempJsonPath = './temp-analysis.json'
            await analyzer.exportToJson(path, {
                outputPath: tempJsonPath,
                format: 'json',
                includeMetadata: true,
                timestamp: true,
            })

            // Read the JSON data
            const analysisData = JSON.parse(
                fs.readFileSync(tempJsonPath, 'utf8')
            )

            // Create database config
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
                    types: 'type_schemas',
                },
            }

            // Connect to database and save
            const adapter = new MongoDBAdapter(dbConfig)
            await adapter.connect()
            await adapter.createCollections()
            await adapter.saveAnalysis(analysisData)
            await adapter.close()

            // Clean up temp file
            fs.unlinkSync(tempJsonPath)

            console.log('✅ Analysis saved to database')
        } catch (error) {
            console.error('❌ Database save failed:', error)
            process.exit(1)
        }
    })

// Command 4: AI Analysis
program
    .command('ai')
    .description(
        'Analyze project with AI and generate intelligent documentation'
    )
    .argument('<path>', 'Path to the NestJS project source directory')
    .option(
        '--provider <provider>',
        'AI provider (google, openai, anthropic)',
        'google'
    )
    .option('--model <model>', 'AI model to use')
    .option('--api-key <key>', 'AI API key (overrides config)')
    .option('--temperature <temp>', 'AI temperature (0.0-1.0)', '0.7')
    .option('--max-tokens <tokens>', 'Maximum tokens for response', '4000')
    .option(
        '--template <template>',
        'Prompt template (default, security, performance)',
        'default'
    )
    .option('--custom-prompt <prompt>', 'Custom prompt template')
    .option('--output <path>', 'Output file path for AI analysis')
    .option('-v, --verbose', 'Show verbose output')
    .action(async (path: string, options: any) => {
        try {
            // Load configuration
            const config = ConfigLoader.loadConfig(path)

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

            // Debug logging
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

            // Run analysis
            const analyzer = new AutoDocGen({
                verbose:
                    options.verbose !== undefined
                        ? options.verbose
                        : config.analysis.verbose,
                colorOutput: config.analysis.colorOutput,
            })

            // First export to JSON
            const tempJsonPath = './temp-analysis.json'
            await analyzer.exportToJson(path, {
                outputPath: tempJsonPath,
                format: 'json',
                includeMetadata: true,
                timestamp: true,
            })

            // Read the JSON data
            const analysisData = JSON.parse(
                fs.readFileSync(tempJsonPath, 'utf8')
            )

            // Create AI service
            const aiConfig = {
                provider: provider as 'google' | 'openai' | 'anthropic',
                model,
                apiKey,
                temperature:
                    parseFloat(options.temperature) || config.ai.temperature,
                maxTokens: parseInt(options.maxTokens) || config.ai.maxTokens,
                customPrompt: options.customPrompt,
            }

            const aiService = new AIService(aiConfig)

            // Build prompt based on template
            let prompt: string
            if (options.customPrompt) {
                prompt = options.customPrompt
            } else {
                const template = PromptTemplates.getTemplate(
                    options.template || 'default'
                )
                prompt = PromptTemplates.buildPrompt(template, analysisData)
            }

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

            // Write AI analysis to file as text
            fs.writeFileSync(outputPath, aiAnalysis)

            // Clean up temp file
            fs.unlinkSync(tempJsonPath)

            console.log('✅ AI analysis completed!')
            console.log(`📄 Results saved to: ${outputPath}`)
            console.log(
                `📝 Generated ${aiAnalysis.length} characters of analysis`
            )
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

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason)
    process.exit(1)
})

// Parse command line arguments
program.parse()
