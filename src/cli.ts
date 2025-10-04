#!/usr/bin/env node

import { Command } from 'commander'
import { AutoDocGen } from './core/analyzer'
import { SimpleOptions } from './types/common.types'

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
