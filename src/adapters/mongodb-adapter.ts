// MongoDB types - will be available after npm install
const MongoClient = require('mongodb').MongoClient
type Db = any
import {
    DatabaseAdapter,
    DatabaseConfig,
    DocumentationEntity,
    EndpointEntity,
    TypeSchemaEntity,
} from '../types/database.types'

export class MongoDBAdapter implements DatabaseAdapter {
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
        await this.db
            .collection(this.config.collections.endpoints)
            .createIndex({ documentationId: 1 })

        // Create types collection if enabled
        if (this.config.mapping.includeTypeSchemas) {
            await this.db.createCollection(this.config.collections.types)
            await this.db
                .collection(this.config.collections.types)
                .createIndex({ name: 1 })
            await this.db
                .collection(this.config.collections.types)
                .createIndex({ documentationId: 1 })
        }
    }

    async insertDocumentation(doc: DocumentationEntity): Promise<string> {
        const result = await this.db
            .collection(this.config.collections.documentation)
            .insertOne(doc)
        return result.insertedId.toString()
    }

    async insertEndpoints(endpoints: EndpointEntity[]): Promise<string[]> {
        if (endpoints.length === 0) return []

        const result = await this.db
            .collection(this.config.collections.endpoints)
            .insertMany(endpoints)
        return Object.values(result.insertedIds).map((id: any) => id.toString())
    }

    async insertTypeSchemas(schemas: TypeSchemaEntity[]): Promise<void> {
        if (!this.config.mapping.includeTypeSchemas || schemas.length === 0)
            return

        await this.db
            .collection(this.config.collections.types)
            .insertMany(schemas)
    }

    async close(): Promise<void> {
        await this.client.close()
    }
}
