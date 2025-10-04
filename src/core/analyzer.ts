import { Project } from 'ts-morph'
import { JsonExporter } from '../exporters/json-exporter'
import { ControllerExtractor } from '../extractors/controller-extractor'
import { ServiceExtractor } from '../extractors/service-extractor'
import { TypeExtractor } from '../extractors/type-extractor'
import { SimpleOptions } from '../types/common.types'
import { ControllerInfo } from '../types/controller.types'
import { ServiceInfo } from '../types/service.types'
import { FileUtils } from '../utils/file-utils'
import { Logger } from './logger'

export interface JsonOutputOptions {
    outputPath: string
    format: 'json' | 'json-pretty'
    includeMetadata: boolean
    timestamp: boolean
}

export class AutoDocGen {
    private options: SimpleOptions
    private project: Project
    private controllerExtractor: ControllerExtractor
    private serviceExtractor: ServiceExtractor
    private typeExtractor: TypeExtractor
    private logger: Logger

    constructor(options: SimpleOptions = {}) {
        this.options = {
            verbose: false,
            includePrivate: false,
            colorOutput: true,
            ...options,
        }

        this.project = new Project({
            useInMemoryFileSystem: false,
            skipAddingFilesFromTsConfig: true,
        })

        this.controllerExtractor = new ControllerExtractor(
            this.project,
            this.options
        )
        this.serviceExtractor = new ServiceExtractor(this.project)
        this.typeExtractor = new TypeExtractor(this.project)
        this.logger = new Logger(this.options)
    }

    /**
     * Main analysis method - displays results in console
     */
    async analyze(projectPath: string): Promise<void> {
        const startTime = Date.now()

        try {
            if (this.options.verbose) {
                console.log(`🔍 Starting analysis of: ${projectPath}`)
            }

            // Find all TypeScript files
            const files = await FileUtils.findTypeScriptFiles(projectPath)

            if (files.length === 0) {
                console.log(
                    '❌ No TypeScript files found in the specified directory.'
                )
                return
            }

            if (this.options.verbose) {
                console.log(`📁 Found ${files.length} TypeScript files`)
            }

            // Add files to the project
            const sourceFiles = files
                .map((file) => {
                    try {
                        return this.project.addSourceFileAtPath(file)
                    } catch (error) {
                        if (this.options.verbose) {
                            console.warn(
                                `⚠️  Could not parse file: ${file}`,
                                error
                            )
                        }
                        return null
                    }
                })
                .filter((file) => file !== null)

            // Extract controllers and services
            const controllers = await this.findControllers(sourceFiles)
            const services = await this.findServices(sourceFiles)

            const analysisTime = (Date.now() - startTime) / 1000

            // Log results
            this.logger.logResults(controllers, services, analysisTime)
            this.logger.logFinalSummary(controllers, services, analysisTime)
        } catch (error) {
            console.error('❌ Analysis failed:', error)
            throw error
        }
    }

    /**
     * Export analysis results to JSON file
     */
    async exportToJson(
        projectPath: string,
        options: JsonOutputOptions
    ): Promise<string> {
        const startTime = Date.now()

        try {
            if (this.options.verbose) {
                console.log(`🔍 Starting JSON export for: ${projectPath}`)
            }

            // Find all TypeScript files
            const files = await FileUtils.findTypeScriptFiles(projectPath)

            if (files.length === 0) {
                throw new Error(
                    'No TypeScript files found in the specified directory.'
                )
            }

            // Add files to the project
            const sourceFiles = files
                .map((file) => {
                    try {
                        return this.project.addSourceFileAtPath(file)
                    } catch (error) {
                        if (this.options.verbose) {
                            console.warn(
                                `⚠️  Could not parse file: ${file}`,
                                error
                            )
                        }
                        return null
                    }
                })
                .filter((file) => file !== null)

            // Extract controllers, services, and types
            const controllers = await this.findControllers(sourceFiles)
            const services = await this.findServices(sourceFiles)
            const types = this.typeExtractor.extractAllTypes(sourceFiles)

            const analysisTime = (Date.now() - startTime) / 1000

            // Create metadata
            const metadata = {
                projectPath,
                analysisTime,
                totalFiles: files.length,
            }

            // Export to JSON
            const jsonExporter = new JsonExporter(options)
            const outputPath = await jsonExporter.exportAnalysis(
                controllers,
                services,
                types,
                metadata
            )

            if (this.options.verbose) {
                console.log(
                    `✅ JSON export completed in ${analysisTime.toFixed(2)}s`
                )
                console.log(`📁 Controllers: ${controllers.length}`)
                console.log(`📁 Services: ${services.length}`)
                console.log(`📁 Types: ${types.length}`)
            }

            return outputPath
        } catch (error) {
            console.error('❌ JSON export failed:', error)
            throw error
        }
    }

    /**
     * Find all controllers in the source files
     */
    private async findControllers(
        sourceFiles: any[]
    ): Promise<ControllerInfo[]> {
        const controllers: ControllerInfo[] = []

        for (const sourceFile of sourceFiles) {
            try {
                const controllerInfo =
                    this.controllerExtractor.extractControllerInfo(sourceFile)
                if (controllerInfo) {
                    controllers.push(controllerInfo)
                }
            } catch (error) {
                if (this.options.verbose) {
                    console.warn(
                        `⚠️  Could not extract controller from: ${sourceFile.getFilePath()}`,
                        error
                    )
                }
            }
        }

        return controllers
    }

    /**
     * Find all services in the source files
     */
    private async findServices(sourceFiles: any[]): Promise<ServiceInfo[]> {
        const services: ServiceInfo[] = []

        for (const sourceFile of sourceFiles) {
            try {
                const serviceInfo =
                    this.serviceExtractor.extractServiceInfo(sourceFile)
                if (serviceInfo) {
                    services.push(serviceInfo)
                }
            } catch (error) {
                if (this.options.verbose) {
                    console.warn(
                        `⚠️  Could not extract service from: ${sourceFile.getFilePath()}`,
                        error
                    )
                }
            }
        }

        return services
    }
}
