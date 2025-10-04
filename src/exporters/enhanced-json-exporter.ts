import { mkdirSync, writeFileSync } from 'fs'
import { dirname } from 'path'
import {
    AnalysisMetadata,
    AnalysisSummary,
    EnhancedAnalysisResult,
    EnhancedControllerInfo,
    TypeSchema,
} from '../types/enhanced-output.types'

export interface EnhancedJsonOutputOptions {
    outputPath?: string
    format?: 'json' | 'json-pretty'
    includeMetadata?: boolean
    includeTypeSchemas?: boolean
    timestamp?: boolean
}

export class EnhancedJsonExporter {
    private options: EnhancedJsonOutputOptions

    constructor(options: EnhancedJsonOutputOptions = {}) {
        this.options = {
            outputPath: './docs/enhanced-analysis.json',
            format: 'json-pretty',
            includeMetadata: true,
            includeTypeSchemas: true,
            timestamp: true,
            ...options,
        }
    }

    /**
     * Export enhanced analysis results to JSON
     */
    async exportEnhancedAnalysis(
        controllers: EnhancedControllerInfo[],
        typeSchemas: TypeSchema,
        metadata: any
    ): Promise<string> {
        const result = this.buildEnhancedResult(
            controllers,
            typeSchemas,
            metadata
        )
        const jsonString = this.formatJson(result)
        await this.writeToFile(jsonString)
        return this.options.outputPath!
    }

    /**
     * Build enhanced analysis result
     */
    private buildEnhancedResult(
        controllers: EnhancedControllerInfo[],
        typeSchemas: TypeSchema,
        metadata: any
    ): EnhancedAnalysisResult {
        const totalEndpoints = controllers.reduce(
            (sum, c) => sum + c.endpoints.length,
            0
        )
        const totalDtos = Object.values(typeSchemas).filter(
            (t) => t.type === 'class'
        ).length
        const totalInterfaces = Object.values(typeSchemas).filter(
            (t) => t.type === 'interface'
        ).length

        const analysisMetadata: AnalysisMetadata = {
            generatedAt: new Date().toISOString(),
            version: '2.0.0',
            projectPath: metadata.projectPath || '',
            analysisTime: metadata.analysisTime || 0,
            totalFiles: metadata.totalFiles || 0,
            totalControllers: controllers.length,
            totalServices: metadata.totalServices || 0,
            totalEndpoints,
            totalTypes: Object.keys(typeSchemas).length,
        }

        const summary: AnalysisSummary = {
            controllers: controllers.length,
            services: metadata.totalServices || 0,
            totalEndpoints,
            totalTypes: Object.keys(typeSchemas).length,
            totalDtos,
            totalInterfaces,
            analysisTime: metadata.analysisTime || 0,
        }

        return {
            metadata: analysisMetadata,
            apiEndpoints: controllers,
            typeSchemas,
            summary,
        }
    }

    /**
     * Format JSON output
     */
    private formatJson(result: EnhancedAnalysisResult): string {
        if (this.options.format === 'json-pretty') {
            return JSON.stringify(result, null, 2)
        }
        return JSON.stringify(result)
    }

    /**
     * Write JSON to file
     */
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

    /**
     * Generate OpenAPI-compatible structure
     */
    generateOpenAPIStructure(controllers: EnhancedControllerInfo[]): any {
        const openapi = {
            openapi: '3.0.0',
            info: {
                title: 'API Documentation',
                version: '1.0.0',
                description: 'Auto-generated API documentation',
            },
            servers: [
                {
                    url: 'http://localhost:3000',
                    description: 'Development server',
                },
            ],
            paths: {} as Record<string, any>,
            components: {
                schemas: {},
            },
        }

        // Add paths from controllers
        for (const controller of controllers) {
            for (const endpoint of controller.endpoints) {
                const pathKey = endpoint.fullPath || endpoint.path

                if (!openapi.paths[pathKey]) {
                    openapi.paths[pathKey] = {}
                }

                openapi.paths[pathKey][endpoint.method.toLowerCase()] = {
                    summary: endpoint.summary,
                    description: endpoint.description,
                    parameters: endpoint.parameters.map((param) => ({
                        name: param.name,
                        in: param.location,
                        required: param.required,
                        description: param.description,
                        schema: param.schema,
                    })),
                    requestBody: endpoint.requestSchema
                        ? {
                              required: true,
                              content: {
                                  'application/json': {
                                      schema: endpoint.requestSchema,
                                  },
                              },
                          }
                        : undefined,
                    responses: this.generateOpenAPIResponses(endpoint),
                    tags: endpoint.tags || [
                        controller.name.replace('Controller', ''),
                    ],
                }
            }
        }

        return openapi
    }

    /**
     * Generate OpenAPI responses
     */
    private generateOpenAPIResponses(endpoint: any): any {
        const responses: any = {}

        for (const statusCode of endpoint.statusCodes) {
            responses[statusCode.code] = {
                description: statusCode.description,
                content: endpoint.responseSchema
                    ? {
                          'application/json': {
                              schema: endpoint.responseSchema,
                              examples: endpoint.examples.reduce(
                                  (acc: any, example: any) => {
                                      if (example.response) {
                                          acc[`example-${statusCode.code}`] = {
                                              value: example.response,
                                          }
                                      }
                                      return acc
                                  },
                                  {}
                              ),
                          },
                      }
                    : undefined,
            }
        }

        return responses
    }

    /**
     * Export as OpenAPI specification
     */
    async exportAsOpenAPI(
        controllers: EnhancedControllerInfo[],
        outputPath?: string
    ): Promise<string> {
        const openapi = this.generateOpenAPIStructure(controllers)
        const jsonString = JSON.stringify(openapi, null, 2)

        const finalPath =
            outputPath ||
            this.options.outputPath!.replace('.json', '-openapi.json')
        const outputDir = dirname(finalPath)

        try {
            mkdirSync(outputDir, { recursive: true })
        } catch (error) {
            // Directory might already exist, ignore error
        }

        writeFileSync(finalPath, jsonString, 'utf8')
        return finalPath
    }
}
