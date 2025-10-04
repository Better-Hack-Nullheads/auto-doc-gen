import { mkdirSync, writeFileSync } from 'fs'
import { dirname } from 'path'
import { ControllerInfo } from '../types/controller.types'
import {
    ExtractedType,
    JsonAnalysisResult,
    JsonOutputOptions,
} from '../types/json-output.types'
import { ServiceInfo } from '../types/service.types'

export class JsonExporter {
    private options: JsonOutputOptions

    constructor(options: JsonOutputOptions = {}) {
        this.options = {
            outputPath: './docs/analysis.json',
            format: 'json-pretty',
            includeMetadata: true,
            groupBy: 'none',
            timestamp: true,
            ...options,
        }
    }

    async exportAnalysis(
        controllers: ControllerInfo[],
        services: ServiceInfo[],
        types: ExtractedType[],
        metadata: any
    ): Promise<string> {
        const result = this.buildJsonResult(
            controllers,
            services,
            types,
            metadata
        )
        const jsonString = this.formatJson(result)
        await this.writeToFile(jsonString)
        return this.options.outputPath!
    }

    private buildJsonResult(
        controllers: ControllerInfo[],
        services: ServiceInfo[],
        types: ExtractedType[],
        metadata: any
    ): JsonAnalysisResult {
        const totalMethods =
            controllers.reduce((sum, c) => sum + c.methods.length, 0) +
            services.reduce((sum, s) => sum + s.methods.length, 0)

        const totalDtos = types.filter((t) => t.type === 'class').length
        const totalInterfaces = types.filter(
            (t) => t.type === 'interface'
        ).length

        return {
            metadata: {
                generatedAt: new Date().toISOString(),
                version: '1.0.0',
                projectPath: metadata.projectPath || '',
                analysisTime: metadata.analysisTime || 0,
                totalFiles: metadata.totalFiles || 0,
                totalControllers: controllers.length,
                totalServices: services.length,
                totalMethods,
                totalTypes: types.length,
            },
            controllers,
            services,
            types,
            summary: {
                controllers: controllers.length,
                services: services.length,
                totalMethods,
                totalTypes: types.length,
                totalDtos,
                totalInterfaces,
                analysisTime: metadata.analysisTime || 0,
            },
        }
    }

    private formatJson(result: JsonAnalysisResult): string {
        if (this.options.format === 'json-pretty') {
            return JSON.stringify(result, null, 2)
        }
        return JSON.stringify(result)
    }

    private async writeToFile(jsonString: string): Promise<void> {
        const outputPath = this.options.outputPath!
        const outputDir = dirname(outputPath)

        // Create directory if it doesn't exist
        try {
            mkdirSync(outputDir, { recursive: true })
        } catch (error) {
            // Directory might already exist, ignore error
        }

        // Write file
        writeFileSync(outputPath, jsonString, 'utf8')
    }
}
