#!/usr/bin/env node

import { Command } from 'commander'
import * as fs from 'fs'
import * as pathModule from 'path'
import { MongoDBAdapter } from './adapters/mongodb-adapter'
import { DatabaseConfigLoader } from './config/database-config'
import { AutoDocGen } from './core/analyzer'
import { EnhancedJsonExporter } from './exporters/enhanced-json-exporter'
import { DatabaseMapper } from './mappers/database-mapper'
import { SimpleOptions } from './types/common.types'
import { JsonOutputOptions } from './types/json-output.types'

const program = new Command()

/**
 * Extract database name from MongoDB connection string
 */
function extractDatabaseName(connectionString: string): string {
    try {
        const url = new URL(connectionString)
        const pathname = url.pathname
        return pathname.startsWith('/') ? pathname.slice(1) : pathname || 'api_docs'
    } catch {
        // Fallback for malformed URLs
        return 'api_docs'
    }
}

/**
 * Read configuration from file
 */
function readConfig(configPath: string): any {
    try {
        if (fs.existsSync(configPath)) {
            const configContent = fs.readFileSync(configPath, 'utf8')
            return JSON.parse(configContent)
        }
    } catch (error) {
        console.log(`⚠️  Could not read config file: ${configPath}`)
    }
    return null
}

program
    .name('auto-doc-gen')
    .description('Simple NestJS controller and service analyzer')
    .version('1.0.0')

program
    .command('setup')
    .description('Setup AutoDocGen scripts and configuration')
    .action(() => {
        try {
            // Import and run the setup function
            const setupPath = pathModule.join(__dirname, 'setup.js')
            require(setupPath)
        } catch (error) {
            console.error('❌ Setup failed:', (error as Error).message)
            process.exit(1)
        }
    })

program
    .command('analyze')
    .description('Analyze NestJS project and display controllers and services')
    .argument('<path>', 'Path to the NestJS project source directory')
    .option('-v, --verbose', 'Show verbose output', false)
    .option('--no-color', 'Disable colored output', false)
    .option('--include-private', 'Include private methods', false)
    .option('-o, --output <path>', 'Also export to JSON file')
    .option(
        '-f, --format <format>',
        'JSON format: json, json-pretty',
        'json-pretty'
    )
    .option('--no-metadata', 'Exclude metadata from JSON output', false)
    .option('--group-by <type>', 'Group by: file, type, module', 'none')
    .option('--timestamp', 'Include timestamp in JSON output', true)
    .action(async (path: string, options: any) => {
        try {
            const analyzerOptions: SimpleOptions = {
                verbose: options.verbose,
                colorOutput: options.color,
                includePrivate: options.includePrivate,
            }

            const analyzer = new AutoDocGen(analyzerOptions)
            await analyzer.analyze(path)

            // Export to JSON if output path is provided
            if (options.output) {
                const jsonOptions: JsonOutputOptions = {
                    outputPath: options.output,
                    format: options.format,
                    includeMetadata: !options.noMetadata,
                    groupBy: options.groupBy,
                    timestamp: options.timestamp,
                }

                const outputPath = await analyzer.exportToJson(
                    path,
                    jsonOptions
                )
                console.log(`\n✅ JSON exported to: ${outputPath}`)
            }
        } catch (error) {
            console.error('❌ Analysis failed:', error)
            process.exit(1)
        }
    })

program
    .command('export')
    .description('Export analysis results to JSON file')
    .argument('<path>', 'Path to the NestJS project source directory')
    .option('-o, --output <path>', 'Output file path', './docs/analysis.json')
    .option(
        '-f, --format <format>',
        'Output format: json, json-pretty',
        'json-pretty'
    )
    .option('--no-metadata', 'Exclude metadata from output', false)
    .option('--group-by <type>', 'Group by: file, type, module', 'none')
    .option('--timestamp', 'Include timestamp in output', true)
    .option('-v, --verbose', 'Show verbose output', false)
    .option(
        '-c, --config <path>',
        'Use configuration file',
        'autodocgen.config.json'
    )
    .action(async (path: string, options: any) => {
        try {
            // Read config file if specified
            let config = null
            if (options.config) {
                config = readConfig(options.config)
            }

            const analyzer = new AutoDocGen({
                verbose:
                    options.verbose ||
                    config?.output?.console?.verbose ||
                    false,
                colorOutput: config?.output?.console?.colorOutput ?? true,
            })

            // Use config values if available, otherwise use command line options
            const jsonOptions: JsonOutputOptions = {
                outputPath:
                    options.output ||
                    (config?.output?.json
                        ? pathModule.join(
                              config.output.json.outputDir || './docs',
                              config.output.json.filename || 'analysis.json'
                          )
                        : './docs/analysis.json'),
                format:
                    options.format ||
                    (config?.output?.json?.pretty ? 'json-pretty' : 'json'),
                includeMetadata: options.noMetadata
                    ? false
                    : config?.output?.json?.includeMetadata ?? true,
                groupBy: options.groupBy || 'none',
                timestamp:
                    options.timestamp ??
                    config?.output?.json?.timestamp ??
                    true,
            }

            const outputPath = await analyzer.exportToJson(path, jsonOptions)
            console.log(`✅ JSON exported to: ${outputPath}`)
        } catch (error) {
            console.error('❌ Export failed:', error)
            process.exit(1)
        }
    })

program
    .command('export-all')
    .description('Export analysis in multiple formats')
    .argument('<path>', 'Path to the NestJS project source directory')
    .option('-d, --dir <directory>', 'Output directory', './docs')
    .option('-v, --verbose', 'Show verbose output', false)
    .action(async (path: string, options: any) => {
        try {
            const analyzer = new AutoDocGen({
                verbose: options.verbose,
                colorOutput: true,
            })

            const outputDir = options.dir
            const timestamp = new Date().toISOString().split('T')[0]

            // Export JSON pretty format
            const jsonPrettyOptions: JsonOutputOptions = {
                outputPath: `${outputDir}/analysis-${timestamp}.json`,
                format: 'json-pretty',
                includeMetadata: true,
                groupBy: 'none',
                timestamp: true,
            }

            // Export JSON compact format
            const jsonCompactOptions: JsonOutputOptions = {
                outputPath: `${outputDir}/analysis-${timestamp}-compact.json`,
                format: 'json',
                includeMetadata: true,
                groupBy: 'none',
                timestamp: true,
            }

            const prettyPath = await analyzer.exportToJson(
                path,
                jsonPrettyOptions
            )
            const compactPath = await analyzer.exportToJson(
                path,
                jsonCompactOptions
            )

            console.log(`✅ JSON (pretty) exported to: ${prettyPath}`)
            console.log(`✅ JSON (compact) exported to: ${compactPath}`)
        } catch (error) {
            console.error('❌ Export failed:', error)
            process.exit(1)
        }
    })

program
    .command('enhanced')
    .description(
        'Generate enhanced analysis with resolved types and API endpoints'
    )
    .argument('<path>', 'Path to the NestJS project source directory')
    .option(
        '-o, --output <path>',
        'Output file path',
        './docs/enhanced-analysis.json'
    )
    .option(
        '-f, --format <format>',
        'Output format: json, json-pretty',
        'json-pretty'
    )
    .option('--openapi', 'Also generate OpenAPI specification', false)
    .option('--database', 'Save analysis to database (requires --db-url or config file)', false)
    .option('--db-type <type>', 'Database type: mongodb', 'mongodb')
    .option('--db-url <url>', 'Database connection URL (required for --database)')
    .option('-v, --verbose', 'Show verbose output', false)
    .action(async (path: string, options: any) => {
        try {
            const analyzer = new AutoDocGen({
                verbose: options.verbose,
                colorOutput: true,
            })

            const outputPath = await analyzer.exportEnhancedAnalysis(path, {
                outputPath: options.output,
                format: options.format,
            })

            console.log(`✅ Enhanced analysis exported to: ${outputPath}`)

            // Save to database if requested
            if (options.database) {
                try {
                    // Load database config
                    let dbConfig = DatabaseConfigLoader.loadFromFile(
                        'autodocgen.config.json'
                    )
                    
                    // Check if we have a valid config or CLI URL
                    if (!dbConfig && !options.dbUrl) {
                        console.error('❌ Database URL required!')
                        console.log('💡 Options:')
                        console.log('   1. Add database config to autodocgen.config.json')
                        console.log('   2. Use --db-url option: --db-url "mongodb://localhost:27017/your_db"')
                        process.exit(1)
                    }

                    // Create config from CLI options if no config file
                    if (!dbConfig) {
                        if (!options.dbUrl) {
                            console.error('❌ Database URL required!')
                            console.log('💡 Use --db-url option: --db-url "mongodb://localhost:27017/your_db"')
                            process.exit(1)
                        }
                        
                        // Create minimal config from CLI options
                        dbConfig = {
                            type: options.dbType || 'mongodb',
                            connectionString: options.dbUrl,
                            database: extractDatabaseName(options.dbUrl),
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
                    } else {
                        // Override config file with CLI options
                        if (options.dbUrl) {
                            dbConfig.connectionString = options.dbUrl
                            dbConfig.database = extractDatabaseName(options.dbUrl)
                        }
                        if (options.dbType) {
                            dbConfig.type = options.dbType as any
                        }
                    }

                    // Connect to database and save
                    const adapter = new MongoDBAdapter(dbConfig)
                    await adapter.connect()
                    await adapter.createCollections()

                    const mapper = new DatabaseMapper(adapter)

                    // Read the generated analysis file
                    const analysisData = JSON.parse(
                        fs.readFileSync(outputPath, 'utf8')
                    )
                    await mapper.mapToDatabase(analysisData)

                    await adapter.close()
                    console.log('✅ Analysis saved to database')
                } catch (error) {
                    console.error('❌ Database save failed:', error)
                }
            }

            if (options.openapi) {
                // Generate OpenAPI spec from the enhanced analysis
                const enhancedExporter = new EnhancedJsonExporter({
                    outputPath: options.output,
                    format: options.format,
                })

                // Read the enhanced analysis file and generate OpenAPI
                const analysisPath =
                    options.output || './docs/enhanced-analysis.json'
                if (fs.existsSync(analysisPath)) {
                    const analysisData = JSON.parse(
                        fs.readFileSync(analysisPath, 'utf8')
                    )
                    const openapiPath = await enhancedExporter.exportAsOpenAPI(
                        analysisData.apiEndpoints
                    )
                    console.log(`📄 OpenAPI spec exported to: ${openapiPath}`)
                } else {
                    console.log(
                        '❌ Enhanced analysis file not found. Run enhanced analysis first.'
                    )
                }
            }
        } catch (error) {
            console.error('❌ Enhanced analysis failed:', error)
            process.exit(1)
        }
    })

program
    .command('info')
    .description(
        'Get information about controllers and services without detailed output'
    )
    .argument('<path>', 'Path to the NestJS project source directory')
    .action(async (path: string) => {
        try {
            const analyzer = new AutoDocGen({
                verbose: false,
                colorOutput: true,
            })
            const results = await analyzer.getAnalysisResults(path)

            console.log('📊 Quick Analysis Results:')
            console.log(`   Controllers: ${results.controllers.length}`)
            console.log(`   Services: ${results.services.length}`)
            console.log(`   Analysis time: ${results.analysisTime.toFixed(2)}s`)

            if (results.controllers.length > 0) {
                console.log('\n🎯 Controllers:')
                results.controllers.forEach((controller) => {
                    console.log(
                        `   • ${controller.name} (${controller.methods.length} methods)`
                    )
                })
            }

            if (results.services.length > 0) {
                console.log('\n🔧 Services:')
                results.services.forEach((service) => {
                    console.log(
                        `   • ${service.name} (${service.methods.length} methods)`
                    )
                })
            }
        } catch (error) {
            console.error('❌ Analysis failed:', error)
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

// Parse command line arguments
program.parse()
