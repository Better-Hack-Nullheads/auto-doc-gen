#!/usr/bin/env node

import { Command } from 'commander'
import * as fs from 'fs'
import { MongoDBAdapter } from './adapters/mongodb-adapter'
import { AutoDocGen } from './core/analyzer'
import { SimpleOptions } from './types/common.types'

const program = new Command()

/**
 * Extract database name from MongoDB connection string
 */
function extractDatabaseName(connectionString: string): string {
    try {
        const url = new URL(connectionString)
        const pathname = url.pathname
        return pathname.startsWith('/')
            ? pathname.slice(1)
            : pathname || 'api_docs'
    } catch {
        return 'api_docs'
    }
}

program
    .name('auto-doc-gen')
    .description('Simple NestJS controller and service analyzer')
    .version('1.0.0')

// Command 1: Console Analysis
program
    .command('analyze')
    .description(
        'Analyze NestJS project and display controllers and services in console'
    )
    .argument('<path>', 'Path to the NestJS project source directory')
    .option('-v, --verbose', 'Show verbose output', false)
    .option('--no-color', 'Disable colored output', false)
    .option('--include-private', 'Include private methods', false)
    .action(async (path: string, options: any) => {
        try {
            const analyzerOptions: SimpleOptions = {
                verbose: options.verbose,
                colorOutput: options.color,
                includePrivate: options.includePrivate,
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
    .option('-o, --output <path>', 'Output file path', './docs/analysis.json')
    .option('-v, --verbose', 'Show verbose output', false)
    .action(async (path: string, options: any) => {
        try {
            const analyzer = new AutoDocGen({
                verbose: options.verbose,
                colorOutput: true,
            })

            const outputPath = await analyzer.exportToJson(path, {
                outputPath: options.output,
                format: 'json-pretty',
                includeMetadata: true,
                timestamp: true,
            })

            console.log(`✅ JSON exported to: ${outputPath}`)
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
    .option('--db-url <url>', 'MongoDB connection URL (required)')
    .option('-v, --verbose', 'Show verbose output', false)
    .action(async (path: string, options: any) => {
        try {
            if (!options.dbUrl) {
                console.error('❌ Database URL required!')
                console.log(
                    '💡 Use --db-url option: --db-url "mongodb://localhost:27017/your_db"'
                )
                process.exit(1)
            }

            const analyzer = new AutoDocGen({
                verbose: options.verbose,
                colorOutput: true,
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
                type: 'mongodb' as const,
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
