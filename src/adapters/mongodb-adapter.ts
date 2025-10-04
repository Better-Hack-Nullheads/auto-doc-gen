import { Db, Document, InsertOneResult, MongoClient, WithId } from 'mongodb'
import { DatabaseConfig } from '../types/database.types'

interface DocumentationEntry {
    content: string
    source: string
    provider: string
    model: string
    timestamp: Date
    metadata: any
    createdAt: Date
    updatedAt: Date
}

interface AnalysisEntry {
    title: string
    description: string
    version: string
    createdAt: Date
    updatedAt: Date
    analysisData: any
}

interface EndpointEntry {
    path: string
    method: string
    controllerName: string
    methodName: string
    parameters: any[]
    documentationId: string
    summary: string
    tags: string[]
}

interface TypeSchemaEntry {
    name: string
    type: string
    definition: string
    documentationId: string
}

export class MongoDBAdapter {
    private client: MongoClient
    private db: Db
    private config: DatabaseConfig
    private isConnected: boolean = false

    constructor(config: DatabaseConfig) {
        this.config = config
        this.client = new MongoClient(config.connectionString)
        this.db = this.client.db(config.database)
    }

    async connect(): Promise<void> {
        if (!this.isConnected) {
            await this.client.connect()
            this.isConnected = true
            await this.createCollections()
        }
    }

    async disconnect(): Promise<void> {
        if (this.isConnected) {
            await this.client.close()
            this.isConnected = false
        }
    }

    private async createCollections(): Promise<void> {
        if (!this.config.mapping.createCollections) return

        try {
            // Create documentation collection with proper indexes
            await this.db.createCollection(
                this.config.collections.documentation
            )
            const docCollection = this.db.collection(
                this.config.collections.documentation
            )
            await docCollection.createIndex({ timestamp: -1 })
            await docCollection.createIndex({ provider: 1, model: 1 })
            await docCollection.createIndex({ 'metadata.totalControllers': 1 })

            // Create endpoints collection
            await this.db.createCollection(this.config.collections.endpoints)
            const endpointCollection = this.db.collection(
                this.config.collections.endpoints
            )
            await endpointCollection.createIndex({ path: 1, method: 1 })
            await endpointCollection.createIndex({ controllerName: 1 })
            await endpointCollection.createIndex({ documentationId: 1 })

            // Create types collection if enabled
            if (this.config.mapping.includeTypeSchemas) {
                await this.db.createCollection(this.config.collections.types)
                const typesCollection = this.db.collection(
                    this.config.collections.types
                )
                await typesCollection.createIndex({ name: 1 })
                await typesCollection.createIndex({ documentationId: 1 })
            }
        } catch (error) {
            // Collections might already exist, which is fine
            console.warn(
                'Warning: Some collections might already exist:',
                error
            )
        }
    }

    async saveAnalysis(analysisData: any): Promise<void> {
        if (!this.isConnected) {
            throw new Error('Database not connected. Call connect() first.')
        }

        try {
            // Create documentation entry
            const documentation: AnalysisEntry = {
                title: 'API Documentation',
                description: 'Auto-generated API documentation',
                version: '1.0.0',
                createdAt: new Date(),
                updatedAt: new Date(),
                analysisData: analysisData,
            }

            const docResult: InsertOneResult = await this.db
                .collection(this.config.collections.documentation)
                .insertOne(documentation)

            const docId = docResult.insertedId.toString()

            // Save controllers as endpoints
            const endpoints: EndpointEntry[] = []
            for (const controller of analysisData.controllers || []) {
                for (const method of controller.methods || []) {
                    endpoints.push({
                        path: method.path || '/',
                        method: method.httpMethod || 'GET',
                        controllerName: controller.name,
                        methodName: method.name,
                        parameters: method.parameters || [],
                        documentationId: docId,
                        summary: method.name,
                        tags: [controller.name],
                    })
                }
            }

            if (endpoints.length > 0) {
                await this.db
                    .collection(this.config.collections.endpoints)
                    .insertMany(endpoints)
            }

            // Save types if enabled
            if (this.config.mapping.includeTypeSchemas && analysisData.types) {
                const typeSchemas: TypeSchemaEntry[] = analysisData.types.map(
                    (type: any) => ({
                        name: type.name,
                        type: type.type,
                        definition: JSON.stringify(type),
                        documentationId: docId,
                    })
                )

                if (typeSchemas.length > 0) {
                    await this.db
                        .collection(this.config.collections.types)
                        .insertMany(typeSchemas)
                }
            }
        } catch (error) {
            throw new Error(`Failed to save analysis: ${error}`)
        }
    }

    async saveDocumentation(docData: any): Promise<void> {
        if (!this.isConnected) {
            throw new Error('Database not connected. Call connect() first.')
        }

        try {
            const documentation: DocumentationEntry = {
                content: docData.content,
                source: docData.source,
                provider: docData.provider,
                model: docData.model,
                timestamp: new Date(docData.timestamp),
                metadata: docData.metadata,
                createdAt: new Date(),
                updatedAt: new Date(),
            }

            await this.db
                .collection(this.config.collections.documentation)
                .insertOne(documentation)
        } catch (error) {
            throw new Error(`Failed to save documentation: ${error}`)
        }
    }

    // Legacy method for backward compatibility
    async close(): Promise<void> {
        await this.disconnect()
    }

    // Additional utility methods
    async getDocumentationCount(): Promise<number> {
        if (!this.isConnected) {
            throw new Error('Database not connected. Call connect() first.')
        }

        return await this.db
            .collection(this.config.collections.documentation)
            .countDocuments()
    }

    async getLatestDocumentation(
        limit: number = 10
    ): Promise<WithId<Document>[]> {
        if (!this.isConnected) {
            throw new Error('Database not connected. Call connect() first.')
        }

        return await this.db
            .collection(this.config.collections.documentation)
            .find({})
            .sort({ timestamp: -1 })
            .limit(limit)
            .toArray()
    }
}
