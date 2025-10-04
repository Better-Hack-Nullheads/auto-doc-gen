import { z } from 'zod'

// AI Provider Interface
export interface AIProvider {
    name: string
    models: string[]
    createModel(modelName: string, apiKey: string): any
    getProviderOptions(): any
}

// AI Configuration Interface
export interface AIConfig {
    provider: 'google' | 'openai' | 'anthropic'
    model: string
    apiKey: string
    temperature?: number
    maxTokens?: number
    customPrompt?: string
}

// AI Analysis Response Schema (based on actual analysis data structure)
export const AIAnalysisSchema = z.object({
    projectOverview: z.object({
        name: z.string(),
        description: z.string(),
        architecture: z.string(),
        technologyStack: z.array(z.string()),
        complexity: z.enum(['simple', 'medium', 'complex']),
        totalFiles: z.number(),
        totalControllers: z.number(),
        totalServices: z.number(),
        totalMethods: z.number(),
        totalTypes: z.number(),
    }),
    controllers: z.array(
        z.object({
            name: z.string(),
            filePath: z.string(),
            basePath: z.string().optional(),
            purpose: z.string(),
            endpoints: z.array(
                z.object({
                    name: z.string(),
                    path: z.string(),
                    method: z.string(),
                    description: z.string(),
                    parameters: z.array(
                        z.object({
                            name: z.string(),
                            type: z.string(),
                            decorator: z.string().optional(),
                            optional: z.boolean(),
                            description: z.string(),
                        })
                    ),
                    returnType: z.string(),
                    decorators: z.array(z.string()),
                    isPublic: z.boolean(),
                    examples: z.array(z.string()).optional(),
                })
            ),
        })
    ),
    services: z.array(
        z.object({
            name: z.string(),
            filePath: z.string(),
            purpose: z.string(),
            dependencies: z.array(z.string()),
            methods: z.array(
                z.object({
                    name: z.string(),
                    description: z.string(),
                    parameters: z.array(
                        z.object({
                            name: z.string(),
                            type: z.string(),
                            optional: z.boolean(),
                            description: z.string(),
                        })
                    ),
                    returnType: z.string(),
                    decorators: z.array(z.string()),
                    isPublic: z.boolean(),
                    businessLogic: z.string().optional(),
                })
            ),
        })
    ),
    dataModels: z.array(
        z.object({
            name: z.string(),
            type: z.enum(['class', 'interface', 'enum', 'type']),
            filePath: z.string(),
            definition: z.string(),
            description: z.string(),
            properties: z.array(
                z.object({
                    name: z.string(),
                    type: z.string(),
                    optional: z.boolean(),
                    decorators: z.array(z.string()),
                    validationRules: z.array(z.string()),
                    defaultValue: z.string().optional(),
                })
            ),
            methods: z.array(z.string()).optional(),
            decorators: z.array(z.string()),
            imports: z.array(
                z.object({
                    name: z.string(),
                    from: z.string(),
                    isDefault: z.boolean(),
                    isNamespace: z.boolean(),
                })
            ),
            exports: z.array(z.string()),
            dependencies: z.array(z.string()),
                    validationRules: z.array(z.string()),
        })
    ),
    recommendations: z.array(
        z.object({
            category: z.enum([
                'security',
                'performance',
                'architecture',
                'documentation',
                'code-quality',
                'best-practices',
            ]),
            priority: z.enum(['low', 'medium', 'high']),
            description: z.string(),
            suggestion: z.string(),
            affectedComponents: z.array(z.string()).optional(),
        })
    ),
})

// Type inference from schema
export type AIAnalysis = z.infer<typeof AIAnalysisSchema>

// AI Configuration for AutoDocGen
export interface AutoDocGenAIConfig {
    enabled: boolean
    provider: 'google' | 'openai' | 'anthropic'
    model: string
    apiKey?: string
    temperature?: number
    maxTokens?: number
    outputDir: string
    filename: string
    templates: {
        default: string
        security: string
        performance: string
        custom?: string
    }
    providers: {
        google: {
            models: string[]
            defaultModel: string
        }
        openai: {
            models: string[]
            defaultModel: string
        }
        anthropic: {
            models: string[]
            defaultModel: string
        }
    }
}
