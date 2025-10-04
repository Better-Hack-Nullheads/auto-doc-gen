// MongoDB types - will be available after npm install
const MongoClient = require('mongodb').MongoClient
type Db = any
import { DatabaseConfig } from '../types/database.types'

export class MongoDBAdapter {
    private client: any
    private db: any
    private config: DatabaseConfig

    constructor(config: DatabaseConfig) {
        this.config = config
        this.client = new MongoClient(config.connectionString)
        this.db = this.client.db(config.database)
    }

    async connect(): Promise<void> {
        await this.client.connect()
    }

    async createCollections(): Promise<void> {
        if (!this.config.mapping.createCollections) return

        // Create documentation collection
        await this.db.createCollection(this.config.collections.documentation)
        await this.db
            .collection(this.config.collections.documentation)
            .createIndex({ title: 1 })

        // Create endpoints collection
        await this.db.createCollection(this.config.collections.endpoints)
        await this.db
            .collection(this.config.collections.endpoints)
            .createIndex({ path: 1, method: 1 })

        // Create types collection if enabled
        if (this.config.mapping.includeTypeSchemas) {
            await this.db.createCollection(this.config.collections.types)
            await this.db
                .collection(this.config.collections.types)
                .createIndex({ name: 1 })
        }
    }

    async saveAnalysis(analysisData: any): Promise<void> {
        // Create documentation entry
        const documentation = {
            title: 'API Documentation',
            description: 'Auto-generated API documentation',
            version: '1.0.0',
            createdAt: new Date(),
            updatedAt: new Date(),
            analysisData: analysisData,
        }

        const docResult = await this.db
            .collection(this.config.collections.documentation)
            .insertOne(documentation)

        const docId = docResult.insertedId.toString()

        // Save controllers as endpoints
        const endpoints = []
        for (const controller of analysisData.controllers) {
            for (const method of controller.methods) {
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
            const typeSchemas = analysisData.types.map((type: any) => ({
                name: type.name,
                type: type.type,
                definition: JSON.stringify(type),
                documentationId: docId,
            }))

            if (typeSchemas.length > 0) {
                await this.db
                    .collection(this.config.collections.types)
                    .insertMany(typeSchemas)
            }
        }
    }

    async close(): Promise<void> {
        await this.client.close()
    }
}
