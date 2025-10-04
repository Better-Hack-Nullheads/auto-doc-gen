# Database Schema Mapping System - Action Plan

## 🎯 Overview

Create a customizable database schema mapping system that transforms AutoDocGen JSON output into database entities. Starting with MongoDB support, but designed to be extensible for other databases (PostgreSQL, MySQL, etc.).

## 📋 Current State Analysis

-   AutoDocGen generates comprehensive JSON with API endpoints and type schemas
-   Need to transform this JSON data into database entities
-   Target schema: Documentation and Endpoint entities (similar to TypeORM)
-   Support multiple database types (MongoDB first, then PostgreSQL, MySQL, etc.)
-   Create mapping functions that convert JSON to database-ready schemas

## 🚀 Phase 1: Database Schema Mapping System

### 1.1 Configuration File Structure

Create `autodocgen.config.js` for database mapping configuration:

```javascript
// autodocgen.config.js
module.exports = {
    // Project settings
    project: {
        name: 'My NestJS API',
        version: '1.0.0',
        description: 'API documentation with database integration',
    },

    // Database configuration
    database: {
        type: 'mongodb', // mongodb, postgresql, mysql, sqlite
        connectionString: 'mongodb://localhost:27017/api_docs',
        database: 'api_docs',

        // Schema mapping options
        mapping: {
            enabled: true,
            createCollections: true,
            includeTypeSchemas: true,
            includeValidationRules: true,
        },

        // Collection/Table names
        collections: {
            documentation: 'documentation',
            endpoints: 'endpoints',
            types: 'type_schemas',
        },
    },

    // Output configuration
    output: {
        formats: ['json', 'database'],
        path: './docs',
        databaseOutput: true,
    },
}
```

### 1.2 Target Database Schema

Based on your TypeORM entities, here's the MongoDB equivalent:

```javascript
// MongoDB Collections Structure
const DocumentationSchema = {
    _id: ObjectId,
    title: String,
    description: String,
    version: String,
    createdAt: Date,
    updatedAt: Date,
    // Reference to endpoints
    endpointIds: [ObjectId],
}

const EndpointSchema = {
    _id: ObjectId,
    path: String,
    method: String,
    parameters: [
        {
            name: String,
            location: String, // 'query' | 'header' | 'path' | 'body'
            required: Boolean,
            description: String,
            type: String,
        },
    ],
    request: String, // JSON schema or example
    response: String, // JSON schema or example
    codeExamples: [
        {
            language: String,
            code: String,
        },
    ],
    documentationId: ObjectId, // Reference to documentation
    controllerName: String,
    summary: String,
    tags: [String],
}
```

### 1.3 Configuration Validation

-   Validate configuration file syntax
-   Check database connection availability
-   Verify collection/table names
-   Validate mapping options

## 🚀 Phase 2: JSON to Database Mapping

### 2.1 Core Mapping Function

```typescript
interface DatabaseMapper {
    mapToDatabase(jsonData: EnhancedAnalysisResult): Promise<DatabaseEntities>
    createDocumentationEntity(metadata: any): DocumentationEntity
    createEndpointEntities(endpoints: EnhancedApiEndpoint[]): EndpointEntity[]
    createTypeSchemaEntities(typeSchemas: TypeSchema): TypeSchemaEntity[]
}

interface DocumentationEntity {
    title: string
    description: string
    version: string
    createdAt: Date
    updatedAt: Date
    endpointIds: string[]
}

interface EndpointEntity {
    path: string
    method: string
    parameters: ParameterEntity[]
    request: string
    response: string
    codeExamples: CodeExampleEntity[]
    documentationId: string
    controllerName: string
    summary: string
    tags: string[]
}
```

### 2.2 JSON Data Transformation

**Input**: AutoDocGen enhanced-analysis.json
**Output**: Database-ready entities

```typescript
// Example transformation function
function transformJsonToDatabase(jsonData: any): DatabaseEntities {
    // 1. Create Documentation entity from metadata
    const documentation = {
        title: jsonData.metadata.projectName || 'API Documentation',
        description: jsonData.metadata.description || '',
        version: jsonData.metadata.version || '1.0.0',
        createdAt: new Date(),
        updatedAt: new Date(),
        endpointIds: [],
    }

    // 2. Transform API endpoints
    const endpoints = jsonData.apiEndpoints.flatMap((controller) =>
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
            request: JSON.stringify(endpoint.requestSchema),
            response: JSON.stringify(endpoint.responseSchema),
            codeExamples: generateCodeExamples(endpoint),
            controllerName: controller.name,
            summary: endpoint.summary,
            tags: endpoint.tags || [],
        }))
    )

    return { documentation, endpoints }
}
```

### 2.3 Database-Specific Adapters

```typescript
interface DatabaseAdapter {
    connect(): Promise<void>
    createCollections(): Promise<void>
    insertDocumentation(doc: DocumentationEntity): Promise<string>
    insertEndpoints(endpoints: EndpointEntity[]): Promise<string[]>
    insertTypeSchemas(schemas: TypeSchemaEntity[]): Promise<void>
    close(): Promise<void>
}

class MongoDBAdapter implements DatabaseAdapter {
    // MongoDB-specific implementation
}

class PostgreSQLAdapter implements DatabaseAdapter {
    // PostgreSQL-specific implementation
}
```

## 🚀 Phase 3: CLI Integration

### 3.1 New CLI Commands

```bash
# Generate analysis and save to database
autodocgen enhanced ../backend/src --database

# Initialize database configuration
autodocgen db:init

# Test database connection
autodocgen db:test

# Generate and save to specific database
autodocgen enhanced ../backend/src --db-type mongodb --db-url "mongodb://localhost:27017/api_docs"

# Show database status
autodocgen db:status
```

### 3.2 Database Output Integration

```typescript
// Enhanced CLI command with database support
program
    .command('enhanced')
    .description('Generate enhanced analysis with database storage')
    .argument('<path>', 'Path to the NestJS project source directory')
    .option(
        '-o, --output <path>',
        'Output file path',
        './docs/enhanced-analysis.json'
    )
    .option('--database', 'Save analysis to database', false)
    .option(
        '--db-type <type>',
        'Database type: mongodb, postgresql, mysql',
        'mongodb'
    )
    .option('--db-url <url>', 'Database connection URL')
    .action(async (path: string, options: any) => {
        const analyzer = new AutoDocGen()

        // Generate analysis
        const outputPath = await analyzer.exportEnhancedAnalysis(path, options)

        // Save to database if requested
        if (options.database) {
            const dbMapper = new DatabaseMapper(options.dbType, options.dbUrl)
            await dbMapper.saveAnalysisToDatabase(outputPath)
            console.log('✅ Analysis saved to database')
        }
    })
```

### 3.3 Database Status and Management

```bash
# Show collections/tables created
autodocgen db:collections

# Clear all documentation data
autodocgen db:clear

# Export database data to JSON
autodocgen db:export --output ./backup.json

# Import data from JSON
autodocgen db:import --input ./backup.json
```

## 🚀 Phase 4: Implementation Example

### 4.1 Core Mapping Function Implementation

```typescript
// src/mappers/database-mapper.ts
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

        // 3. Insert type schemas if enabled
        if (jsonData.typeSchemas) {
            const typeSchemas = this.createTypeSchemaEntities(
                jsonData.typeSchemas
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
                request: JSON.stringify(endpoint.requestSchema),
                response: JSON.stringify(endpoint.responseSchema),
                codeExamples: this.generateCodeExamples(endpoint),
                documentationId,
                controllerName: controller.name,
                summary: endpoint.summary,
                tags: endpoint.tags || [],
            }))
        )
    }
}
```

### 4.2 MongoDB Adapter Implementation

```typescript
// src/adapters/mongodb-adapter.ts
export class MongoDBAdapter implements DatabaseAdapter {
    private client: MongoClient
    private db: Db

    constructor(connectionString: string, databaseName: string) {
        this.client = new MongoClient(connectionString)
        this.db = this.client.db(databaseName)
    }

    async connect(): Promise<void> {
        await this.client.connect()
    }

    async createCollections(): Promise<void> {
        // Create documentation collection
        await this.db.createCollection('documentation')
        await this.db.collection('documentation').createIndex({ title: 1 })

        // Create endpoints collection
        await this.db.createCollection('endpoints')
        await this.db
            .collection('endpoints')
            .createIndex({ path: 1, method: 1 })
        await this.db
            .collection('endpoints')
            .createIndex({ documentationId: 1 })
    }

    async insertDocumentation(doc: DocumentationEntity): Promise<string> {
        const result = await this.db.collection('documentation').insertOne(doc)
        return result.insertedId.toString()
    }

    async insertEndpoints(endpoints: EndpointEntity[]): Promise<string[]> {
        const result = await this.db
            .collection('endpoints')
            .insertMany(endpoints)
        return Object.values(result.insertedIds).map((id) => id.toString())
    }
}
```

## 🚀 Phase 5: Usage Examples

### 5.1 Basic Usage

```bash
# Generate analysis and save to MongoDB
autodocgen enhanced ../backend/src --database --db-type mongodb --db-url "mongodb://localhost:27017/api_docs"

# Check what was saved
autodocgen db:collections
```

### 5.2 Configuration File Usage

```bash
# Create config file
autodocgen db:init

# Use config file
autodocgen enhanced ../backend/src --database
```

### 5.3 Database Management

```bash
# View saved documentation
autodocgen db:query --collection documentation

# Export all data
autodocgen db:export --output ./backup.json

# Clear and re-import
autodocgen db:clear
autodocgen db:import --input ./backup.json
```

## 📁 File Structure Changes

```
auto-doc-gen/
├── src/
│   ├── config/
│   │   ├── config-loader.ts
│   │   ├── config-validator.ts
│   │   └── default-config.ts
│   ├── adapters/
│   │   ├── database-adapter.ts
│   │   ├── mongodb-adapter.ts
│   │   └── postgresql-adapter.ts
│   ├── mappers/
│   │   ├── database-mapper.ts
│   │   └── json-transformer.ts
│   ├── types/
│   │   ├── database.types.ts
│   │   └── mapping.types.ts
│   └── cli/
│       └── database-commands.ts
├── templates/
│   ├── autodocgen.config.js
│   └── database-schema.md
└── docs/
    └── MONGODB_CONFIGURATION_PLAN.md
```

## 🎯 Implementation Priority

### High Priority (Phase 1-2)

1. **JSON to Database Mapping Function** - Core transformation logic
2. **MongoDB Adapter** - Basic database operations
3. **CLI Integration** - `--database` flag support
4. **Configuration System** - Database connection settings

### Medium Priority (Phase 3-4)

1. **Multiple Database Support** - PostgreSQL, MySQL adapters
2. **Advanced CLI Commands** - Database management commands
3. **Data Validation** - Schema validation and error handling
4. **Configuration Management** - Config file support

### Low Priority (Phase 5-6)

1. **Advanced Features** - Data export/import, querying
2. **Performance Optimization** - Batch operations, indexing
3. **Monitoring** - Database health checks
4. **Documentation** - User guides and examples

## 🔧 Technical Requirements

### Dependencies

-   `mongodb` - MongoDB driver
-   `pg` - PostgreSQL driver (future)
-   `mysql2` - MySQL driver (future)
-   `joi` or `zod` - Configuration validation
-   `chalk` - CLI output formatting

### Core Features

-   JSON data transformation to database entities
-   Database-agnostic adapter pattern
-   Configuration file support
-   CLI command integration
-   Error handling and validation

## 🎉 Success Metrics

1. **Core Functionality**

    - ✅ Transform AutoDocGen JSON to database entities
    - ✅ Save documentation and endpoints to MongoDB
    - ✅ CLI integration with `--database` flag
    - ✅ Basic configuration support

2. **Database Integration**

    - ✅ MongoDB adapter working
    - ✅ Proper entity relationships
    - ✅ Data validation and error handling
    - ✅ Connection management

3. **Developer Experience**

    - ✅ Simple CLI commands
    - ✅ Clear error messages
    - ✅ Configuration file support
    - ✅ Database management commands

## 🚀 Next Steps

1. **Core Mapping Function** - Implement JSON to database transformation
2. **MongoDB Adapter** - Create MongoDB-specific database operations
3. **CLI Integration** - Add `--database` flag to enhanced command
4. **Testing** - Test with real AutoDocGen JSON output
5. **Configuration** - Add database configuration support
6. **Documentation** - Create usage examples

This plan focuses on the core functionality: transforming AutoDocGen JSON output into database entities that match your TypeORM-like schema structure.
