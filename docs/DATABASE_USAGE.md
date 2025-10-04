# Database Integration Usage Guide

## Quick Start

### 1. Install MongoDB

```bash
# Install MongoDB locally or use MongoDB Atlas
# For local development:
# - Download from https://www.mongodb.com/try/download/community
# - Start MongoDB service
```

### 2. Generate Analysis with Database Storage

```bash
# Basic usage - saves to MongoDB
autodocgen enhanced ../backend/src --database

# With custom database URL
autodocgen enhanced ../backend/src --database --db-url "mongodb://localhost:27017/my_api_docs"

# With custom database type (currently only MongoDB supported)
autodocgen enhanced ../backend/src --database --db-type mongodb
```

### 3. Configuration File

Create or update `autodocgen.config.json`:

```json
{
    "database": {
        "type": "mongodb",
        "connectionString": "mongodb://localhost:27017/api_docs",
        "database": "api_docs",
        "mapping": {
            "enabled": true,
            "createCollections": true,
            "includeTypeSchemas": true,
            "includeValidationRules": true
        },
        "collections": {
            "documentation": "documentation",
            "endpoints": "endpoints",
            "types": "type_schemas"
        }
    }
}
```

## Database Schema

### Documentation Collection

```javascript
{
  _id: ObjectId,
  title: "API Documentation",
  description: "Auto-generated API documentation",
  version: "1.0.0",
  createdAt: Date,
  updatedAt: Date,
  endpointIds: [ObjectId]
}
```

### Endpoints Collection

```javascript
{
  _id: ObjectId,
  path: "/api/products",
  method: "GET",
  parameters: [
    {
      name: "id",
      location: "path",
      required: true,
      description: "Product ID",
      type: "string"
    }
  ],
  request: "{}",
  response: "{\"id\": \"string\", \"name\": \"string\"}",
  codeExamples: [
    {
      language: "json",
      code: "{\"id\": \"123\"}"
    }
  ],
  documentationId: ObjectId,
  controllerName: "ProductsController",
  summary: "Get product by ID",
  tags: ["products"]
}
```

### Type Schemas Collection

```javascript
{
  _id: ObjectId,
  name: "CreateProductDto",
  type: "class",
  definition: "{\"properties\": {...}}",
  properties: [...],
  validationRules: [...],
  documentationId: ObjectId
}
```

## Examples

### Basic Analysis with Database

```bash
# Analyze backend and save to database
autodocgen enhanced ../backend/src --database

# Output:
# ✅ Enhanced analysis exported to: ./docs/enhanced-analysis.json
# ✅ Analysis saved to database
```

### Custom Database Configuration

```bash
# Use custom MongoDB instance
autodocgen enhanced ../backend/src --database --db-url "mongodb://user:pass@localhost:27017/my_docs"
```

### With OpenAPI Generation

```bash
# Generate analysis, save to database, and create OpenAPI spec
autodocgen enhanced ../backend/src --database --openapi
```

## Troubleshooting

### Connection Issues

-   Ensure MongoDB is running
-   Check connection string format
-   Verify database permissions

### Collection Creation

-   Collections are created automatically if `createCollections: true`
-   Check MongoDB logs for any creation errors

### Data Validation

-   All data is validated before insertion
-   Check console output for any validation errors
