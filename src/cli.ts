#!/usr/bin/env node

import { Command } from 'commander'
import { AutoDocGen } from './core/analyzer'
import { SimpleOptions } from './types/common.types'
import { JsonOutputOptions } from './types/json-output.types'

const program = new Command()

program
    .name('auto-doc-gen')
    .description('Simple NestJS controller and service analyzer')
    .version('1.0.0')

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
    .action(async (path: string, options: any) => {
        try {
            const analyzer = new AutoDocGen({
                verbose: options.verbose,
                colorOutput: true,
            })

            const jsonOptions: JsonOutputOptions = {
                outputPath: options.output,
                format: options.format,
                includeMetadata: !options.noMetadata,
                groupBy: options.groupBy,
                timestamp: options.timestamp,
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
