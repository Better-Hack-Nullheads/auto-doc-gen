# JSON Output Action Plan for AutoDocGen

## Overview

This document outlines the comprehensive action plan to transform the AutoDocGen package from console-based output to organized JSON file output. The goal is to provide structured, machine-readable documentation that can be easily consumed by other tools, APIs, or documentation generators.

## Current State Analysis

### Current Implementation

-   **Output Method**: Console logging with colored text using `chalk`
-   **Data Structure**: Well-structured TypeScript interfaces (`ControllerInfo`, `ServiceInfo`, `MethodInfo`)
-   **CLI Commands**: `analyze` and `info` commands with various options
-   **Logger**: Dedicated `Logger` class handling all console output formatting

### Current Data Types

```typescript
// Controllers
interface ControllerInfo {
    name: string
    filePath: string
    basePath?: string
    methods: MethodInfo[]
}

// Services
interface ServiceInfo {
    name: string
    filePath: string
    dependencies: string[]
    methods: MethodInfo[]
}

// Methods
interface MethodInfo {
    name: string
    parameters: ParameterInfo[]
    returnType: string
    decorators: string[]
    isPublic: boolean
}
```

## Action Plan

### Phase 1: JSON Schema Design and Types

#### 1.1 Create JSON Output Types

**File**: `src/types/json-output.types.ts`

```typescript
export interface JsonOutputOptions {
    outputPath?: string
    format?: 'json' | 'json-pretty'
    includeMetadata?: boolean
    groupBy?: 'file' | 'type' | 'none'
    timestamp?: boolean
}

export interface AnalysisMetadata {
    generatedAt: string
    version: string
    projectPath: string
    analysisTime: number
    totalFiles: number
    totalControllers: number
    totalServices: number
    totalMethods: number
}

export interface JsonAnalysisResult {
    metadata: AnalysisMetadata
    controllers: ControllerInfo[]
    services: ServiceInfo[]
    summary: {
        controllers: number
        services: number
        totalMethods: number
        analysisTime: number
    }
}
```

#### 1.2 Enhanced Method Information

**File**: `src/types/enhanced-method.types.ts`

```typescript
export interface EnhancedMethodInfo extends MethodInfo {
    httpMethod?: string
    route?: string
    fullRoute?: string
    description?: string
    tags?: string[]
    requestBody?: any
    responseType?: string
    statusCodes?: number[]
    inputTypes?: TypeInfo[]
    outputTypes?: TypeInfo[]
    validationRules?: ValidationRule[]
}

export interface TypeInfo {
    name: string
    type: string
    filePath?: string
    properties?: PropertyInfo[]
    isInterface: boolean
    isClass: boolean
    isEnum: boolean
    isGeneric: boolean
    genericTypes?: string[]
    extends?: string[]
    implements?: string[]
    decorators?: string[]
}

export interface PropertyInfo {
    name: string
    type: string
    optional: boolean
    decorators?: string[]
    validationRules?: ValidationRule[]
    defaultValue?: any
}

export interface ValidationRule {
    decorator: string
    parameters?: any[]
    message?: string
}
```

#### 1.3 Type Extraction Types

**File**: `src/types/type-extraction.types.ts`

```typescript
export interface TypeExtractionOptions {
    includeInterfaces?: boolean
    includeClasses?: boolean
    includeEnums?: boolean
    includeGenerics?: boolean
    includeValidationRules?: boolean
    includeDecorators?: boolean
    includeImports?: boolean
    maxDepth?: number
}

export interface ExtractedType {
    name: string
    type: 'interface' | 'class' | 'enum' | 'type-alias'
    filePath: string
    definition: string
    properties: PropertyInfo[]
    methods?: MethodInfo[]
    decorators: string[]
    imports: ImportInfo[]
    exports: string[]
    dependencies: string[]
    validationRules?: ValidationRule[]
}

export interface ImportInfo {
    name: string
    from: string
    isDefault: boolean
    isNamespace: boolean
}
```

### Phase 2: JSON Exporter Implementation

#### 2.1 Create JSON Exporter Class

**File**: `src/exporters/json-exporter.ts`

```typescript
import { writeFileSync, mkdirSync } from 'fs'
import { dirname } from 'path'
import {
    JsonOutputOptions,
    JsonAnalysisResult,
} from '../types/json-output.types'
import { ControllerInfo } from '../types/controller.types'
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
        metadata: any
    ): Promise<string> {
        const result = this.buildJsonResult(controllers, services, metadata)
        const jsonString = this.formatJson(result)
        await this.writeToFile(jsonString)
        return this.options.outputPath!
    }

    private buildJsonResult(
        controllers: ControllerInfo[],
        services: ServiceInfo[],
        metadata: any
    ): JsonAnalysisResult {
        // Implementation details
    }

    private formatJson(result: JsonAnalysisResult): string {
        // Implementation details
    }

    private async writeToFile(jsonString: string): Promise<void> {
        // Implementation details
    }
}
```

#### 2.2 File Organization Strategies

**File**: `src/exporters/file-organizer.ts`

```typescript
export class FileOrganizer {
    static organizeByFile(
        controllers: ControllerInfo[],
        services: ServiceInfo[]
    ): any {
        // Group by file path
    }

    static organizeByType(
        controllers: ControllerInfo[],
        services: ServiceInfo[]
    ): any {
        // Group by type (controller/service)
    }

    static organizeByModule(
        controllers: ControllerInfo[],
        services: ServiceInfo[]
    ): any {
        // Group by module/folder structure
    }
}
```

### Phase 3: CLI Command Updates

#### 3.1 Enhanced CLI Options

**File**: `src/cli.ts` (Updates)

```typescript
// New command: export
program
    .command('export')
    .description('Export analysis results to JSON file')
    .argument('<path>', 'Path to the NestJS project source directory')
    .option('-o, --output <path>', 'Output file path', './docs/analysis.json')
    .option(
        '-f, --format <format>',
        'Output format: json, json-pretty',
        'json-pretty'
    )
    .option('--no-metadata', 'Exclude metadata from output', false)
    .option('--group-by <type>', 'Group by: file, type, module', 'none')
    .option('--timestamp', 'Include timestamp in output', true)
    .action(async (path: string, options: any) => {
        // Implementation
    })

// Enhanced analyze command
program
    .command('analyze')
    .description('Analyze NestJS project and display results')
    .argument('<path>', 'Path to the NestJS project source directory')
    .option('-o, --output <path>', 'Also export to JSON file')
    .option(
        '-f, --format <format>',
        'JSON format: json, json-pretty',
        'json-pretty'
    )
    // ... existing options
    .action(async (path: string, options: any) => {
        // Implementation with optional JSON export
    })
```

#### 3.2 Batch Export Commands

```typescript
// Export multiple formats
program
    .command('export-all')
    .description('Export analysis in multiple formats')
    .argument('<path>', 'Path to the NestJS project source directory')
    .option('-d, --dir <directory>', 'Output directory', './docs')
    .action(async (path: string, options: any) => {
        // Export JSON, JSON-pretty, and potentially other formats
    })
```

### Phase 4: Type Extraction Implementation

#### 4.1 Type Extractor Class

**File**: `src/extractors/type-extractor.ts`

```typescript
import {
    Project,
    SourceFile,
    ClassDeclaration,
    InterfaceDeclaration,
    EnumDeclaration,
} from 'ts-morph'
import {
    ExtractedType,
    TypeExtractionOptions,
    PropertyInfo,
    ValidationRule,
} from '../types/type-extraction.types'

export class TypeExtractor {
    private project: Project
    private options: TypeExtractionOptions

    constructor(project: Project, options: TypeExtractionOptions = {}) {
        this.project = project
        this.options = {
            includeInterfaces: true,
            includeClasses: true,
            includeEnums: true,
            includeGenerics: true,
            includeValidationRules: true,
            includeDecorators: true,
            includeImports: true,
            maxDepth: 3,
            ...options,
        }
    }

    extractAllTypes(sourceFiles: SourceFile[]): ExtractedType[] {
        const types: ExtractedType[] = []

        for (const sourceFile of sourceFiles) {
            // Extract interfaces
            if (this.options.includeInterfaces) {
                types.push(...this.extractInterfaces(sourceFile))
            }

            // Extract classes (DTOs, etc.)
            if (this.options.includeClasses) {
                types.push(...this.extractClasses(sourceFile))
            }

            // Extract enums
            if (this.options.includeEnums) {
                types.push(...this.extractEnums(sourceFile))
            }
        }

        return types
    }

    private extractInterfaces(sourceFile: SourceFile): ExtractedType[] {
        // Extract interface definitions
    }

    private extractClasses(sourceFile: SourceFile): ExtractedType[] {
        // Extract class definitions (especially DTOs)
    }

    private extractEnums(sourceFile: SourceFile): ExtractedType[] {
        // Extract enum definitions
    }

    private extractProperties(
        classOrInterface: ClassDeclaration | InterfaceDeclaration
    ): PropertyInfo[] {
        // Extract properties with validation rules and decorators
    }

    private extractValidationRules(property: any): ValidationRule[] {
        // Extract validation decorators like @IsString, @IsNotEmpty, etc.
    }
}
```

#### 4.2 DTO and Interface Extractor

**File**: `src/extractors/dto-extractor.ts`

```typescript
export class DtoExtractor {
    static extractDtoInfo(sourceFile: SourceFile): ExtractedType[] {
        // Specifically extract DTO classes with validation rules
        // Handle @IsString, @IsNotEmpty, @IsOptional, etc.
    }

    static extractValidationDecorators(property: any): ValidationRule[] {
        // Extract class-validator decorators
        const decorators = property.getDecorators()
        return decorators.map((decorator) => ({
            decorator: decorator.getName(),
            parameters: decorator.getArguments().map((arg) => arg.getText()),
            message: this.extractValidationMessage(decorator),
        }))
    }

    private static extractValidationMessage(
        decorator: any
    ): string | undefined {
        // Extract custom validation messages
    }
}
```

#### 4.3 Route Information Extraction

**File**: `src/extractors/route-extractor.ts`

```typescript
export class RouteExtractor {
    static extractRouteInfo(
        method: MethodDeclaration,
        basePath?: string
    ): {
        httpMethod: string
        route: string
        fullRoute: string
    } {
        // Extract HTTP method and route from decorators
        // Combine with base path
    }
}
```

#### 4.4 Enhanced Controller Extractor

**File**: `src/extractors/controller-extractor.ts` (Updates)

```typescript
// Add route extraction to existing methods
private extractMethods(classDeclaration: ClassDeclaration): EnhancedMethodInfo[] {
    // Enhanced method extraction with route information
    // Include input/output type extraction
    // Map DTOs to method parameters
}
```

### Phase 5: Output Formatting and Organization

#### 5.1 JSON Templates

**File**: `src/templates/json-templates.ts`

```typescript
export class JsonTemplates {
    static getOpenApiTemplate(): any {
        // OpenAPI/Swagger compatible structure
    }

    static getNestJSDocTemplate(): any {
        // NestJS documentation format
    }

    static getCustomTemplate(): any {
        // Custom format for specific needs
    }
}
```

#### 5.2 File Naming Conventions

```typescript
export class FileNaming {
    static generateFileName(
        projectName: string,
        format: string,
        timestamp?: boolean
    ): string {
        // Generate consistent file names
        // e.g., "my-project-analysis-2024-01-15.json"
    }
}
```

### Phase 6: Integration and Testing

#### 6.1 Update Main Analyzer

**File**: `src/core/analyzer.ts` (Updates)

```typescript
export class AutoDocGen {
    private jsonExporter?: JsonExporter

    constructor(options: SimpleOptions & JsonOutputOptions = {}) {
        // Initialize JSON exporter if options provided
    }

    async analyze(projectPath: string): Promise<void> {
        // Existing analysis logic
        // Add JSON export if configured
    }

    async exportToJson(
        projectPath: string,
        options: JsonOutputOptions
    ): Promise<string> {
        // Dedicated JSON export method
    }
}
```

#### 6.2 Update Logger

**File**: `src/core/logger.ts` (Updates)

```typescript
export class Logger {
    // Keep existing console logging methods
    // Add JSON export integration
    logAndExport(
        controllers: ControllerInfo[],
        services: ServiceInfo[],
        analysisTime: number,
        jsonOptions?: JsonOutputOptions
    ): void {
        // Log to console AND export to JSON
    }
}
```

## Implementation Timeline

### Week 1: Foundation

-   [ ] Create JSON output types and interfaces
-   [ ] Implement basic JsonExporter class
-   [ ] Update CLI with export command

### Week 2: Enhanced Extraction

-   [ ] Implement route extraction
-   [ ] Enhance method information extraction
-   [ ] Add metadata collection
-   [ ] Implement type extraction (DTOs, interfaces, enums)
-   [ ] Extract validation rules from class-validator decorators
-   [ ] Map input/output types to controller methods

### Week 3: Formatting and Organization

-   [ ] Implement file organization strategies
-   [ ] Create JSON templates
-   [ ] Add file naming conventions

### Week 4: Integration and Testing

-   [ ] Integrate with existing analyzer
-   [ ] Update all CLI commands
-   [ ] Add comprehensive testing
-   [ ] Update documentation

## Example JSON Output Structure

```json
{
    "metadata": {
        "generatedAt": "2024-01-15T10:30:00.000Z",
        "version": "1.0.0",
        "projectPath": "/path/to/nestjs-project",
        "analysisTime": 2.45,
        "totalFiles": 15,
        "totalControllers": 3,
        "totalServices": 5,
        "totalMethods": 23,
        "totalTypes": 8
    },
    "controllers": [
        {
            "name": "ProductsController",
            "filePath": "/src/products/products.controller.ts",
            "basePath": "/api/products",
            "methods": [
                {
                    "name": "create",
                    "httpMethod": "POST",
                    "route": "/",
                    "fullRoute": "/api/products/",
                    "parameters": [
                        {
                            "name": "createProductDto",
                            "type": "CreateProductDto",
                            "decorator": "Body",
                            "optional": false
                        }
                    ],
                    "returnType": "Product",
                    "decorators": ["Post"],
                    "isPublic": true,
                    "inputTypes": [
                        {
                            "name": "CreateProductDto",
                            "type": "class",
                            "filePath": "/src/products/dto/create-product.dto.ts",
                            "properties": [
                                {
                                    "name": "name",
                                    "type": "string",
                                    "optional": false,
                                    "validationRules": [
                                        {
                                            "decorator": "IsString",
                                            "parameters": [],
                                            "message": undefined
                                        },
                                        {
                                            "decorator": "IsNotEmpty",
                                            "parameters": [],
                                            "message": undefined
                                        }
                                    ]
                                },
                                {
                                    "name": "description",
                                    "type": "string",
                                    "optional": true,
                                    "validationRules": [
                                        {
                                            "decorator": "IsString",
                                            "parameters": [],
                                            "message": undefined
                                        },
                                        {
                                            "decorator": "IsOptional",
                                            "parameters": [],
                                            "message": undefined
                                        }
                                    ]
                                },
                                {
                                    "name": "price",
                                    "type": "number",
                                    "optional": false,
                                    "validationRules": [
                                        {
                                            "decorator": "IsNumber",
                                            "parameters": [],
                                            "message": undefined
                                        },
                                        {
                                            "decorator": "IsNotEmpty",
                                            "parameters": [],
                                            "message": undefined
                                        }
                                    ]
                                },
                                {
                                    "name": "category",
                                    "type": "string",
                                    "optional": false,
                                    "validationRules": [
                                        {
                                            "decorator": "IsString",
                                            "parameters": [],
                                            "message": undefined
                                        },
                                        {
                                            "decorator": "IsNotEmpty",
                                            "parameters": [],
                                            "message": undefined
                                        }
                                    ]
                                }
                            ]
                        }
                    ],
                    "outputTypes": [
                        {
                            "name": "Product",
                            "type": "interface",
                            "filePath": "/src/products/products.service.ts",
                            "properties": [
                                {
                                    "name": "id",
                                    "type": "string",
                                    "optional": false
                                },
                                {
                                    "name": "name",
                                    "type": "string",
                                    "optional": false
                                },
                                {
                                    "name": "description",
                                    "type": "string",
                                    "optional": true
                                },
                                {
                                    "name": "price",
                                    "type": "number",
                                    "optional": false
                                },
                                {
                                    "name": "category",
                                    "type": "string",
                                    "optional": false
                                },
                                {
                                    "name": "createdAt",
                                    "type": "Date",
                                    "optional": false
                                },
                                {
                                    "name": "updatedAt",
                                    "type": "Date",
                                    "optional": false
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    ],
    "services": [
        {
            "name": "ProductsService",
            "filePath": "/src/products/products.service.ts",
            "dependencies": ["Repository<Product>"],
            "methods": [
                {
                    "name": "create",
                    "parameters": [
                        {
                            "name": "createProductDto",
                            "type": "CreateProductDto",
                            "optional": false
                        }
                    ],
                    "returnType": "Product",
                    "decorators": [],
                    "isPublic": true,
                    "inputTypes": [
                        {
                            "name": "CreateProductDto",
                            "type": "class",
                            "filePath": "/src/products/dto/create-product.dto.ts"
                        }
                    ],
                    "outputTypes": [
                        {
                            "name": "Product",
                            "type": "interface",
                            "filePath": "/src/products/products.service.ts"
                        }
                    ]
                }
            ]
        }
    ],
    "types": [
        {
            "name": "CreateProductDto",
            "type": "class",
            "filePath": "/src/products/dto/create-product.dto.ts",
            "definition": "export class CreateProductDto",
            "properties": [
                {
                    "name": "name",
                    "type": "string",
                    "optional": false,
                    "validationRules": [
                        {
                            "decorator": "IsString",
                            "parameters": [],
                            "message": undefined
                        },
                        {
                            "decorator": "IsNotEmpty",
                            "parameters": [],
                            "message": undefined
                        }
                    ]
                },
                {
                    "name": "description",
                    "type": "string",
                    "optional": true,
                    "validationRules": [
                        {
                            "decorator": "IsString",
                            "parameters": [],
                            "message": undefined
                        },
                        {
                            "decorator": "IsOptional",
                            "parameters": [],
                            "message": undefined
                        }
                    ]
                },
                {
                    "name": "price",
                    "type": "number",
                    "optional": false,
                    "validationRules": [
                        {
                            "decorator": "IsNumber",
                            "parameters": [],
                            "message": undefined
                        },
                        {
                            "decorator": "IsNotEmpty",
                            "parameters": [],
                            "message": undefined
                        }
                    ]
                },
                {
                    "name": "category",
                    "type": "string",
                    "optional": false,
                    "validationRules": [
                        {
                            "decorator": "IsString",
                            "parameters": [],
                            "message": undefined
                        },
                        {
                            "decorator": "IsNotEmpty",
                            "parameters": [],
                            "message": undefined
                        }
                    ]
                }
            ],
            "decorators": [],
            "imports": [
                {
                    "name": "IsNotEmpty",
                    "from": "class-validator",
                    "isDefault": false,
                    "isNamespace": false
                },
                {
                    "name": "IsNumber",
                    "from": "class-validator",
                    "isDefault": false,
                    "isNamespace": false
                },
                {
                    "name": "IsOptional",
                    "from": "class-validator",
                    "isDefault": false,
                    "isNamespace": false
                },
                {
                    "name": "IsString",
                    "from": "class-validator",
                    "isDefault": false,
                    "isNamespace": false
                }
            ],
            "exports": ["CreateProductDto"],
            "dependencies": ["class-validator"]
        },
        {
            "name": "UpdateProductDto",
            "type": "class",
            "filePath": "/src/products/dto/update-product.dto.ts",
            "definition": "export class UpdateProductDto extends PartialType(CreateProductDto)",
            "properties": [],
            "decorators": [],
            "imports": [
                {
                    "name": "PartialType",
                    "from": "@nestjs/mapped-types",
                    "isDefault": false,
                    "isNamespace": false
                },
                {
                    "name": "CreateProductDto",
                    "from": "./create-product.dto",
                    "isDefault": false,
                    "isNamespace": false
                }
            ],
            "exports": ["UpdateProductDto"],
            "dependencies": ["@nestjs/mapped-types", "./create-product.dto"]
        },
        {
            "name": "Product",
            "type": "interface",
            "filePath": "/src/products/products.service.ts",
            "definition": "export interface Product",
            "properties": [
                {
                    "name": "id",
                    "type": "string",
                    "optional": false
                },
                {
                    "name": "name",
                    "type": "string",
                    "optional": false
                },
                {
                    "name": "description",
                    "type": "string",
                    "optional": true
                },
                {
                    "name": "price",
                    "type": "number",
                    "optional": false
                },
                {
                    "name": "category",
                    "type": "string",
                    "optional": false
                },
                {
                    "name": "createdAt",
                    "type": "Date",
                    "optional": false
                },
                {
                    "name": "updatedAt",
                    "type": "Date",
                    "optional": false
                }
            ],
            "decorators": [],
            "imports": [],
            "exports": ["Product"],
            "dependencies": []
        }
    ],
    "summary": {
        "controllers": 3,
        "services": 5,
        "totalMethods": 23,
        "totalTypes": 8,
        "totalDtos": 2,
        "totalInterfaces": 1,
        "analysisTime": 2.45
    }
}
```

## Benefits of JSON Output with Type Extraction

1. **Machine Readable**: Easy to parse and process programmatically
2. **Tool Integration**: Can be consumed by documentation generators, API tools
3. **Version Control**: JSON files can be tracked and compared
4. **Automation**: Enables automated documentation workflows
5. **Flexibility**: Multiple output formats and organization strategies
6. **Extensibility**: Easy to add new fields and metadata
7. **Complete API Documentation**: Includes input/output types with validation rules
8. **Type Safety**: Full type information for frontend/backend integration
9. **Validation Rules**: Extracted validation decorators for API documentation
10. **Dependency Mapping**: Clear understanding of type relationships and imports
11. **OpenAPI Generation**: Can generate OpenAPI/Swagger specs from extracted types
12. **Code Generation**: Enable client SDK generation from type definitions

## Migration Strategy

1. **Backward Compatibility**: Keep existing console output as default
2. **Gradual Adoption**: Add JSON export as optional feature
3. **Configuration**: Allow users to choose output format
4. **Documentation**: Provide clear examples and migration guide

## Type Extraction Features

### Supported Type Definitions

-   **DTOs**: Data Transfer Objects with validation rules
-   **Interfaces**: TypeScript interfaces and type definitions
-   **Enums**: Enumeration types
-   **Classes**: Regular classes and abstract classes
-   **Type Aliases**: Custom type definitions

### Validation Rule Extraction

-   **class-validator**: `@IsString`, `@IsNumber`, `@IsNotEmpty`, `@IsOptional`, etc.
-   **Custom Validators**: Custom validation decorators
-   **Validation Messages**: Custom error messages
-   **Validation Groups**: Group-based validation rules

### Import/Export Analysis

-   **Dependency Tracking**: Track all imports and exports
-   **Circular Dependencies**: Detect circular import issues
-   **External Dependencies**: Identify third-party library usage
-   **Internal Dependencies**: Map internal module relationships

### Type Relationships

-   **Inheritance**: `extends` and `implements` relationships
-   **Composition**: Property type relationships
-   **Generics**: Generic type parameters and constraints
-   **Union Types**: Union and intersection types

## Future Enhancements

1. **Multiple Formats**: Support for YAML, XML, Markdown
2. **Templates**: Customizable output templates
3. **Plugins**: Extensible architecture for custom exporters
4. **API Integration**: Direct integration with documentation platforms
5. **Real-time Updates**: Watch mode for continuous documentation updates
6. **OpenAPI Generation**: Generate OpenAPI 3.0 specs from extracted types
7. **GraphQL Schema**: Generate GraphQL schemas from TypeScript types
8. **Client SDK Generation**: Generate client libraries in multiple languages
9. **Type Diff Analysis**: Compare type changes between versions
10. **Documentation Generation**: Auto-generate API documentation from types

---

_This action plan provides a comprehensive roadmap for transforming AutoDocGen from console-based to JSON file-based output while maintaining backward compatibility and adding powerful new features._
