# AutoDocGen Improvement Action Plan

## Overview

This document outlines a comprehensive plan to improve the AutoDocGen package to generate documentation-ready analysis output. The current `analysis.json` output has significant limitations that make it unsuitable for API documentation generation.

## Current Issues Analysis

### Major Problems Identified

1. **Missing Input/Output Schema Details**

    - Return types like `"Product"` don't include the actual schema structure
    - No detailed input validation schemas for DTOs
    - Missing HTTP method details and route information

2. **Incomplete Type Resolution**

    - Types like `"Product"` are not resolved to their actual structure
    - No cross-referencing between types and their definitions
    - Missing nested object schemas

3. **Poor Documentation Structure**

    - No API endpoint documentation format
    - Missing request/response examples
    - No validation rule descriptions
    - No HTTP status codes or error responses

4. **Limited Type Information**
    - Generic types like `"Product[]"` don't show array structure
    - Missing interface property details in method signatures
    - No union type resolution (e.g., `"Product | undefined"`)

## Phase 1: Enhanced Type Resolution & Schema Generation

### 1.1 Create Type Resolver Service

**New File**: `src/core/type-resolver.ts`

**Purpose**: Resolve all type references to their actual definitions

**Features**:

-   Resolve `Product` to full interface structure
-   Handle union types (`Product | undefined`)
-   Resolve array types (`Product[]`)
-   Cross-reference types across files
-   Cache resolved types for performance

**Implementation**:

```typescript
export class TypeResolver {
    private typeCache: Map<string, ResolvedType> = new Map()

    resolveType(typeName: string, sourceFile: SourceFile): ResolvedType {
        // Implementation details
    }

    resolveUnionType(unionType: string): ResolvedUnionType {
        // Handle Product | undefined
    }

    resolveArrayType(arrayType: string): ResolvedArrayType {
        // Handle Product[]
    }
}
```

### 1.2 Enhanced Method Analysis

**Modify**: `src/extractors/controller-extractor.ts`

**Add**:

-   HTTP method extraction (`GET`, `POST`, etc.)
-   Route path resolution
-   Request/response schema generation
-   Parameter validation rules
-   Status code mapping

### 1.3 Schema Generator

**New File**: `src/generators/schema-generator.ts`

**Purpose**: Generate OpenAPI-compatible schemas

**Features**:

-   Convert TypeScript types to JSON Schema
-   Generate request/response examples
-   Include validation rules in schema
-   Handle nested objects and arrays
-   Support for enums and union types

## Phase 2: Enhanced Output Structure

### 2.1 New Documentation Types

**Modify**: `src/types/json-output.types.ts`

**Add**:

```typescript
interface ApiEndpoint {
    method: string
    path: string
    summary: string
    description?: string
    requestSchema: JsonSchema
    responseSchema: JsonSchema
    parameters: ParameterSchema[]
    validationRules: ValidationRule[]
    examples: RequestResponseExample[]
    statusCodes: StatusCodeInfo[]
}

interface JsonSchema {
    type: string
    properties: Record<string, PropertySchema>
    required: string[]
    examples: any[]
    description?: string
}

interface ParameterSchema {
    name: string
    type: string
    location: 'path' | 'query' | 'body' | 'header'
    required: boolean
    description?: string
    validationRules: ValidationRule[]
}

interface RequestResponseExample {
    name: string
    description?: string
    request?: any
    response?: any
}
```

### 2.2 Enhanced Controller Info

**Modify**: `src/types/controller.types.ts`

**Add**:

-   Full API endpoint information
-   Resolved input/output schemas
-   HTTP method and route details
-   Validation rules with descriptions
-   Error response schemas

## Phase 3: Improved Extractors

### 3.1 Enhanced Controller Extractor

**Modify**: `src/extractors/controller-extractor.ts`

**Improvements**:

-   Extract HTTP method from decorators (`@Get`, `@Post`, etc.)
-   Extract route paths and parameters
-   Resolve DTO types to full schemas
-   Generate request/response examples
-   Extract Swagger/OpenAPI decorators if present

**New Methods**:

```typescript
private extractHttpMethod(method: MethodDeclaration): string
private extractRoutePath(method: MethodDeclaration): string
private extractRouteParameters(method: MethodDeclaration): ParameterSchema[]
private generateRequestExample(method: MethodDeclaration): any
private generateResponseExample(method: MethodDeclaration): any
```

### 3.2 Enhanced DTO Extractor

**Modify**: `src/extractors/dto-extractor.ts`

**Improvements**:

-   Extract validation messages from decorators
-   Generate JSON Schema from validation rules
-   Include property descriptions
-   Handle nested DTOs
-   Extract default values and examples

### 3.3 New Route Extractor

**New File**: `src/extractors/route-extractor.ts`

**Purpose**: Extract complete API route information

**Features**:

-   Combine controller path + method path
-   Extract route parameters
-   Generate full endpoint URLs
-   Handle dynamic routes and parameters
-   Extract middleware information

## Phase 4: Documentation-Ready Output

### 4.1 Enhanced JSON Exporter

**Modify**: `src/exporters/json-exporter.ts`

**Add**:

-   OpenAPI-compatible structure
-   Grouped endpoints by controller
-   Resolved type schemas
-   Validation rule descriptions
-   Request/response examples

### 4.2 New Documentation Generator

**New File**: `src/generators/documentation-generator.ts`

**Purpose**: Generate human-readable documentation

**Features**:

-   Markdown output
-   API endpoint documentation
-   Type schema documentation
-   Validation rules documentation
-   Interactive examples

## Phase 5: Implementation Priority

### High Priority (Immediate)

1. **Type Resolver Service** - Critical for resolving `Product` types
2. **Enhanced Controller Extractor** - Add HTTP methods and routes
3. **Schema Generator** - Convert types to usable schemas

### Medium Priority

1. **Enhanced DTO Extractor** - Better validation rule extraction
2. **New Output Types** - Documentation-ready structure
3. **Route Extractor** - Complete endpoint information

### Low Priority (Future)

1. **Documentation Generator** - Human-readable output
2. **OpenAPI Export** - Standard API documentation format
3. **Interactive Documentation** - Web-based docs

## Expected Output Structure After Improvements

```json
{
    "metadata": {
        "generatedAt": "2025-01-XX...",
        "version": "1.0.0",
        "projectPath": "src",
        "analysisTime": 4.649,
        "totalFiles": 10,
        "totalControllers": 2,
        "totalServices": 2,
        "totalEndpoints": 8,
        "totalTypes": 9
    },
    "apiEndpoints": [
        {
            "controller": "ProductsController",
            "basePath": "/products",
            "endpoints": [
                {
                    "method": "POST",
                    "path": "/products",
                    "summary": "Create a new product",
                    "requestSchema": {
                        "type": "object",
                        "properties": {
                            "name": {
                                "type": "string",
                                "description": "Product name"
                            },
                            "price": {
                                "type": "number",
                                "description": "Product price"
                            },
                            "category": {
                                "type": "string",
                                "description": "Product category"
                            },
                            "description": {
                                "type": "string",
                                "description": "Product description",
                                "optional": true
                            }
                        },
                        "required": ["name", "price", "category"],
                        "validationRules": [
                            {
                                "field": "name",
                                "rule": "IsString",
                                "message": "Name must be a string"
                            },
                            {
                                "field": "name",
                                "rule": "IsNotEmpty",
                                "message": "Name is required"
                            }
                        ]
                    },
                    "responseSchema": {
                        "type": "object",
                        "properties": {
                            "id": { "type": "string" },
                            "name": { "type": "string" },
                            "price": { "type": "number" },
                            "category": { "type": "string" },
                            "description": {
                                "type": "string",
                                "optional": true
                            },
                            "createdAt": {
                                "type": "string",
                                "format": "date-time"
                            },
                            "updatedAt": {
                                "type": "string",
                                "format": "date-time"
                            }
                        }
                    },
                    "examples": {
                        "request": {
                            "name": "Sample Product",
                            "price": 29.99,
                            "category": "Electronics",
                            "description": "A sample product"
                        },
                        "response": {
                            "id": "1",
                            "name": "Sample Product",
                            "price": 29.99,
                            "category": "Electronics",
                            "description": "A sample product",
                            "createdAt": "2025-01-XX...",
                            "updatedAt": "2025-01-XX..."
                        }
                    }
                }
            ]
        }
    ],
    "typeSchemas": {
        "Product": {
            "type": "interface",
            "properties": {
                "id": { "type": "string" },
                "name": { "type": "string" },
                "price": { "type": "number" },
                "category": { "type": "string" },
                "description": { "type": "string", "optional": true },
                "createdAt": { "type": "Date" },
                "updatedAt": { "type": "Date" }
            }
        }
    }
}
```

## Implementation Timeline

### Week 1-2: Core Type Resolution

-   Implement Type Resolver Service
-   Create Schema Generator
-   Update type definitions

### Week 3-4: Enhanced Extractors

-   Enhance Controller Extractor
-   Improve DTO Extractor
-   Create Route Extractor

### Week 5-6: Output Structure

-   Update JSON Exporter
-   Implement new output types
-   Add validation rule extraction

### Week 7-8: Documentation Features

-   Create Documentation Generator
-   Add example generation
-   Implement OpenAPI compatibility

## Success Metrics

1. **Type Resolution**: All types like `Product` are fully resolved with their schemas
2. **API Documentation**: Complete endpoint information with HTTP methods and routes
3. **Schema Generation**: Valid JSON Schema for all request/response types
4. **Validation Rules**: All validation decorators are properly extracted and documented
5. **Examples**: Request/response examples are generated for all endpoints

## Testing Strategy

1. **Unit Tests**: Test each extractor and generator individually
2. **Integration Tests**: Test the complete analysis pipeline
3. **Output Validation**: Validate generated JSON against expected schema
4. **Documentation Tests**: Ensure generated documentation is accurate and complete

## Future Enhancements

1. **OpenAPI 3.0 Export**: Direct OpenAPI specification generation
2. **Interactive Documentation**: Web-based API documentation
3. **Code Generation**: Generate client SDKs from API analysis
4. **Validation Testing**: Generate test cases from validation rules
5. **Performance Monitoring**: Add performance metrics to analysis

## Conclusion

This action plan transforms AutoDocGen from a basic code analyzer into a comprehensive API documentation generator. The phased approach ensures that critical issues are addressed first while maintaining the existing functionality.

The key improvement is resolving the type resolution issue where `"Product"` becomes a fully detailed schema, making the output truly useful for API documentation generation.
