import { existsSync } from 'fs'
import { join } from 'path'
import {
    ControllerExtractor,
    ExtractedController,
} from '../extractors/controller-extractor'
import {
    ExtractedService,
    ServiceExtractor,
} from '../extractors/service-extractor'
import { ExtractedType, TypeExtractor } from '../extractors/type-extractor'

export interface AnalysisResult {
    metadata: {
        generatedAt: string
        version: string
        projectPath: string
        analysisTime: number
        totalFiles: number
        totalControllers: number
        totalServices: number
        totalMethods: number
        totalTypes: number
    }
    controllers: ExtractedController[]
    services: ExtractedService[]
    types: ExtractedType[]
}

export class Analyzer {
    private projectPath: string

    constructor(projectPath: string) {
        this.projectPath = projectPath
    }

    async analyzeProject(): Promise<AnalysisResult> {
        const startTime = Date.now()

        // Validate project path
        if (!existsSync(this.projectPath)) {
            throw new Error(`Project path does not exist: ${this.projectPath}`)
        }

        // Check for TypeScript config
        const tsConfigPath = join(this.projectPath, 'tsconfig.json')
        if (!existsSync(tsConfigPath)) {
            throw new Error(`TypeScript config not found: ${tsConfigPath}`)
        }

        console.log(`🔍 Analyzing project: ${this.projectPath}`)

        // Extract controllers
        console.log('📋 Extracting controllers...')
        const controllerExtractor = new ControllerExtractor(this.projectPath)
        const controllers = controllerExtractor.extractControllers()

        // Extract services
        console.log('⚙️ Extracting services...')
        const serviceExtractor = new ServiceExtractor(this.projectPath)
        const services = serviceExtractor.extractServices()

        // Extract types
        console.log('📝 Extracting types...')
        const typeExtractor = new TypeExtractor(this.projectPath)
        const types = typeExtractor.extractTypes()

        // Calculate metadata
        const totalMethods =
            controllers.reduce(
                (sum, controller) => sum + controller.methods.length,
                0
            ) +
            services.reduce((sum, service) => sum + service.methods.length, 0)

        const analysisTime = (Date.now() - startTime) / 1000

        const result: AnalysisResult = {
            metadata: {
                generatedAt: new Date().toISOString(),
                version: '2.0.0',
                projectPath: this.projectPath,
                analysisTime,
                totalFiles: this.countSourceFiles(),
                totalControllers: controllers.length,
                totalServices: services.length,
                totalMethods,
                totalTypes: types.length,
            },
            controllers,
            services,
            types,
        }

        console.log(`✅ Analysis completed in ${analysisTime.toFixed(3)}s`)
        console.log(
            `📊 Found: ${controllers.length} controllers, ${services.length} services, ${types.length} types`
        )

        return result
    }

    private countSourceFiles(): number {
        // This is a simplified count - in a real implementation,
        // you'd want to count actual TypeScript source files
        return 10 // Placeholder
    }
}
