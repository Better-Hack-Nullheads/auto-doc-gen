import { Project } from 'ts-morph'
import { EnhancedJsonExporter } from '../exporters/enhanced-json-exporter'
import { JsonExporter } from '../exporters/json-exporter'
import { ControllerExtractor } from '../extractors/controller-extractor'
import { ServiceExtractor } from '../extractors/service-extractor'
import { TypeExtractor } from '../extractors/type-extractor'
import { SimpleOptions } from '../types/common.types'
import { ControllerInfo } from '../types/controller.types'
import {
    EnhancedControllerInfo,
    TypeSchema,
} from '../types/enhanced-output.types'
import { JsonOutputOptions } from '../types/json-output.types'
import { ServiceInfo } from '../types/service.types'
import { FileUtils } from '../utils/file-utils'
import { Logger } from './logger'
import { TypeResolver } from './type-resolver'

export class AutoDocGen {
    private options: SimpleOptions
    private project: Project
    private controllerExtractor: ControllerExtractor
    private serviceExtractor: ServiceExtractor
    private typeExtractor: TypeExtractor
    private typeResolver: TypeResolver
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
        this.typeResolver = new TypeResolver(this.project)
        this.logger = new Logger(this.options)
    }

    /**
     * Main analysis method
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

    /**
     * Get analysis results without logging (for programmatic use)
     */
    async getAnalysisResults(projectPath: string): Promise<{
        controllers: ControllerInfo[]
        services: ServiceInfo[]
        analysisTime: number
    }> {
        const startTime = Date.now()

        // Find all TypeScript files
        const files = await FileUtils.findTypeScriptFiles(projectPath)

        if (files.length === 0) {
            return { controllers: [], services: [], analysisTime: 0 }
        }

        // Add files to the project
        const sourceFiles = files
            .map((file) => {
                try {
                    return this.project.addSourceFileAtPath(file)
                } catch (error) {
                    return null
                }
            })
            .filter((file) => file !== null)

        // Extract controllers and services
        const controllers = await this.findControllers(sourceFiles)
        const services = await this.findServices(sourceFiles)

        const analysisTime = (Date.now() - startTime) / 1000

        return { controllers, services, analysisTime }
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
     * Export enhanced analysis results to JSON
     */
    async exportEnhancedAnalysis(
        projectPath: string,
        options: any = {}
    ): Promise<string> {
        const startTime = Date.now()

        try {
            if (this.options.verbose) {
                console.log(`🔍 Starting enhanced analysis for: ${projectPath}`)
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

            // Set source files for type resolution
            this.typeResolver.setSourceFiles(sourceFiles)
            this.controllerExtractor.setSourceFiles(sourceFiles)

            // Extract enhanced controllers and types
            const enhancedControllers = await this.findEnhancedControllers(
                sourceFiles
            )
            const typeSchemas = await this.buildTypeSchemas(sourceFiles)

            const analysisTime = (Date.now() - startTime) / 1000

            // Create metadata
            const metadata = {
                projectPath,
                analysisTime,
                totalFiles: files.length,
                totalServices: 0, // Will be updated when we enhance service extraction
            }

            // Export enhanced analysis
            const enhancedExporter = new EnhancedJsonExporter({
                outputPath:
                    options.outputPath || './docs/enhanced-analysis.json',
                format: options.format || 'json-pretty',
                includeMetadata: true,
                includeTypeSchemas: true,
                timestamp: true,
            })

            const outputPath = await enhancedExporter.exportEnhancedAnalysis(
                enhancedControllers,
                typeSchemas,
                metadata
            )

            if (this.options.verbose) {
                console.log(
                    `✅ Enhanced analysis completed in ${analysisTime.toFixed(
                        2
                    )}s`
                )
                console.log(`📁 Controllers: ${enhancedControllers.length}`)
                console.log(
                    `📁 Endpoints: ${enhancedControllers.reduce(
                        (sum, c) => sum + c.endpoints.length,
                        0
                    )}`
                )
                console.log(`📁 Types: ${Object.keys(typeSchemas).length}`)
                console.log(`📄 Output: ${outputPath}`)
            }

            return outputPath
        } catch (error) {
            console.error('❌ Enhanced analysis failed:', error)
            throw error
        }
    }

    /**
     * Find enhanced controllers with API endpoints
     */
    private async findEnhancedControllers(
        sourceFiles: any[]
    ): Promise<EnhancedControllerInfo[]> {
        const controllers: EnhancedControllerInfo[] = []

        for (const sourceFile of sourceFiles) {
            try {
                const controllerInfo =
                    this.controllerExtractor.extractEnhancedControllerInfo(
                        sourceFile
                    )
                if (controllerInfo) {
                    controllers.push(controllerInfo)
                }
            } catch (error) {
                if (this.options.verbose) {
                    console.warn(
                        `⚠️  Could not extract enhanced controller from: ${sourceFile.getFilePath()}`,
                        error
                    )
                }
            }
        }

        return controllers
    }

    /**
     * Build type schemas from all source files
     */
    private async buildTypeSchemas(sourceFiles: any[]): Promise<TypeSchema> {
        const typeSchemas: TypeSchema = {}

        for (const sourceFile of sourceFiles) {
            try {
                // Extract all types from the file
                const types = this.typeExtractor.extractAllTypes([sourceFile])

                for (const type of types) {
                    // Resolve the type to get full structure
                    const resolvedType = this.typeResolver.resolveType(
                        type.name,
                        sourceFile
                    )
                    typeSchemas[type.name] = resolvedType
                }
            } catch (error) {
                if (this.options.verbose) {
                    console.warn(
                        `⚠️  Could not extract types from: ${sourceFile.getFilePath()}`,
                        error
                    )
                }
            }
        }

        return typeSchemas
    }
}
