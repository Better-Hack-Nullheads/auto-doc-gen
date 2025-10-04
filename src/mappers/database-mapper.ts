import {
    DatabaseAdapter,
    DocumentationEntity,
    EndpointEntity,
    TypeSchemaEntity,
} from '../types/database.types'
import {
    EnhancedAnalysisResult,
    EnhancedControllerInfo,
} from '../types/enhanced-output.types'

export class DatabaseMapper {
    constructor(private adapter: DatabaseAdapter) {}

    async mapToDatabase(jsonData: EnhancedAnalysisResult): Promise<void> {
        // 1. Create Documentation entity
        const documentation = this.createDocumentationEntity(jsonData.metadata)
        const docId = await this.adapter.insertDocumentation(documentation)

        // 2. Transform and insert endpoints
        const endpoints = this.createEndpointEntities(
            jsonData.apiEndpoints,
            docId
        )
        await this.adapter.insertEndpoints(endpoints)

        // 3. Insert type schemas if available
        if (jsonData.typeSchemas) {
            const typeSchemas = this.createTypeSchemaEntities(
                jsonData.typeSchemas,
                docId
            )
            await this.adapter.insertTypeSchemas(typeSchemas)
        }
    }

    private createDocumentationEntity(metadata: any): DocumentationEntity {
        return {
            title: metadata.projectName || 'API Documentation',
            description:
                metadata.description || 'Auto-generated API documentation',
            version: metadata.version || '1.0.0',
            createdAt: new Date(),
            updatedAt: new Date(),
            endpointIds: [], // Will be populated after endpoint insertion
        }
    }

    private createEndpointEntities(
        apiEndpoints: EnhancedControllerInfo[],
        documentationId: string
    ): EndpointEntity[] {
        return apiEndpoints.flatMap((controller) =>
            controller.endpoints.map((endpoint) => ({
                path: endpoint.fullPath,
                method: endpoint.method,
                parameters: endpoint.parameters.map((param) => ({
                    name: param.name,
                    location: param.location,
                    required: param.required,
                    description: param.description || '',
                    type: param.type,
                })),
                request: JSON.stringify(endpoint.requestSchema || {}),
                response: JSON.stringify(endpoint.responseSchema || {}),
                codeExamples: this.generateCodeExamples(endpoint),
                documentationId,
                controllerName: controller.name,
                summary: endpoint.summary || '',
                tags: endpoint.tags || [],
            }))
        )
    }

    private createTypeSchemaEntities(
        typeSchemas: any,
        documentationId: string
    ): TypeSchemaEntity[] {
        return Object.entries(typeSchemas).map(
            ([name, schema]: [string, any]) => ({
                name,
                type: schema.type || 'unknown',
                definition: JSON.stringify(schema),
                properties: schema.properties || [],
                validationRules: schema.validationRules || [],
                documentationId,
            })
        )
    }

    private generateCodeExamples(endpoint: any): any[] {
        // Simple code example generation
        const examples: any[] = []

        if (endpoint.examples && endpoint.examples.length > 0) {
            endpoint.examples.forEach((example: any) => {
                if (example.request) {
                    examples.push({
                        language: 'json',
                        code: JSON.stringify(example.request, null, 2),
                    })
                }
            })
        }

        return examples
    }
}
