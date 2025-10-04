# Backend Integration Plan: AutoDocGen → NestJS Integration

## Overview

Transform the `@auto-doc-gen/core` package from a CLI-only tool into a fully integrated NestJS module that automatically analyzes and displays controllers and services when your backend application starts.

## Current State Analysis

### ✅ What We Have

-   CLI interface (`auto-doc-gen analyze ./src`)
-   Core analysis engine (`AutoDocGen` class)
-   Controller and service extractors
-   TypeScript AST parsing with `ts-morph`
-   Comprehensive type definitions
-   Programmatic API for analysis

### ❌ What We Need

-   NestJS module integration
-   Automatic startup analysis
-   Backend dependency configuration
-   Lifecycle hooks integration
-   Configuration management

## Action Plan

### Phase 1: Create NestJS Integration Module

#### 1.1 Create Integration Types

**File**: `src/types/integration.types.ts`

```typescript
export interface AutoDocGenOptions {
    autoRun?: boolean // Run analysis on app startup (default: true)
    verbose?: boolean // Show detailed output (default: false)
    colorOutput?: boolean // Use colored console output (default: true)
    includePrivate?: boolean // Include private methods (default: false)
    sourcePath?: string // Path to analyze (default: './src')
    outputFormat?: 'console' | 'file' | 'both' // Output format (default: 'console')
    outputFile?: string // File path for output (default: 'auto-doc-analysis.md')
    delay?: number // Delay before analysis in ms (default: 1000)
}
```

#### 1.2 Create AutoDocGen Service

**File**: `src/integration/auto-doc-gen.service.ts`

```typescript
import {
    Injectable,
    OnApplicationBootstrap,
    Inject,
    Logger,
} from '@nestjs/common'
import { AutoDocGen } from '../core/analyzer'
import { AutoDocGenOptions } from '../types/integration.types'

@Injectable()
export class AutoDocGenService implements OnApplicationBootstrap {
    private readonly logger = new Logger(AutoDocGenService.name)

    constructor(
        @Inject('AUTO_DOC_GEN_OPTIONS')
        private options: AutoDocGenOptions
    ) {}

    async onApplicationBootstrap() {
        if (this.options.autoRun !== false) {
            // Add delay to ensure all modules are loaded
            setTimeout(async () => {
                await this.analyzeProject()
            }, this.options.delay || 1000)
        }
    }

    async analyzeProject(): Promise<void> {
        try {
            this.logger.log('🔍 Starting AutoDocGen analysis...')

            const analyzer = new AutoDocGen({
                verbose: this.options.verbose || false,
                colorOutput: this.options.colorOutput !== false,
                includePrivate: this.options.includePrivate || false,
            })

            const sourcePath = this.options.sourcePath || './src'
            await analyzer.analyze(sourcePath)

            this.logger.log('✅ AutoDocGen analysis completed')
        } catch (error) {
            this.logger.error('❌ AutoDocGen analysis failed:', error)
        }
    }

    async getAnalysisResults() {
        const analyzer = new AutoDocGen({
            verbose: false,
            colorOutput: false,
            includePrivate: this.options.includePrivate || false,
        })

        const sourcePath = this.options.sourcePath || './src'
        return await analyzer.getAnalysisResults(sourcePath)
    }
}
```

#### 1.3 Create AutoDocGen Module

**File**: `src/integration/auto-doc-gen.module.ts`

```typescript
import { Module, DynamicModule } from '@nestjs/common'
import { AutoDocGenService } from './auto-doc-gen.service'
import { AutoDocGenOptions } from '../types/integration.types'

@Module({})
export class AutoDocGenModule {
    static forRoot(options?: AutoDocGenOptions): DynamicModule {
        return {
            module: AutoDocGenModule,
            providers: [
                {
                    provide: 'AUTO_DOC_GEN_OPTIONS',
                    useValue: options || {},
                },
                AutoDocGenService,
            ],
            exports: [AutoDocGenService],
        }
    }

    static forRootAsync(options: {
        useFactory: (
            ...args: any[]
        ) => Promise<AutoDocGenOptions> | AutoDocGenOptions
        inject?: any[]
    }): DynamicModule {
        return {
            module: AutoDocGenModule,
            providers: [
                {
                    provide: 'AUTO_DOC_GEN_OPTIONS',
                    useFactory: options.useFactory,
                    inject: options.inject || [],
                },
                AutoDocGenService,
            ],
            exports: [AutoDocGenService],
        }
    }
}
```

### Phase 2: Update Package Configuration

#### 2.1 Update Package.json

**File**: `package.json` (additions)

```json
{
    "peerDependencies": {
        "@nestjs/common": "^8.0.0 || ^9.0.0 || ^10.0.0 || ^11.0.0",
        "@nestjs/core": "^8.0.0 || ^9.0.0 || ^10.0.0 || ^11.0.0"
    },
    "peerDependenciesMeta": {
        "@nestjs/common": {
            "optional": true
        },
        "@nestjs/core": {
            "optional": true
        }
    }
}
```

#### 2.2 Update Main Exports

**File**: `src/index.ts` (updated)

```typescript
// Main exports for the AutoDocGen package
export { AutoDocGen } from './core/analyzer'
export { Logger } from './core/logger'
export { ControllerExtractor } from './extractors/controller-extractor'
export { ServiceExtractor } from './extractors/service-extractor'
export { FileUtils } from './utils/file-utils'

// NEW: NestJS Integration
export { AutoDocGenModule } from './integration/auto-doc-gen.module'
export { AutoDocGenService } from './integration/auto-doc-gen.service'

// Type exports
export type {
    MethodInfo,
    ParameterInfo,
    SimpleOptions,
} from './types/common.types'
export type { ControllerInfo } from './types/controller.types'
export type { ServiceInfo } from './types/service.types'
export type { AutoDocGenOptions } from './types/integration.types'
```

### Phase 3: Backend Integration Examples

#### 3.1 Basic Integration

**File**: `backend/src/app.module.ts`

```typescript
import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { ProductsModule } from './products/products.module'
import { AutoDocGenModule } from '@auto-doc-gen/core'

@Module({
    imports: [
        ProductsModule,
        AutoDocGenModule.forRoot({
            autoRun: true,
            verbose: true,
            colorOutput: true,
            sourcePath: './src',
            delay: 2000, // Wait 2 seconds after app starts
        }),
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
```

#### 3.2 Advanced Configuration

**File**: `backend/src/app.module.ts` (advanced)

```typescript
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { ProductsModule } from './products/products.module'
import { AutoDocGenModule } from '@auto-doc-gen/core'

@Module({
    imports: [
        ConfigModule.forRoot(),
        ProductsModule,
        AutoDocGenModule.forRootAsync({
            useFactory: (configService: ConfigService) => ({
                autoRun: configService.get('NODE_ENV') === 'development',
                verbose: configService.get('AUTO_DOC_VERBOSE') === 'true',
                colorOutput: configService.get('AUTO_DOC_COLOR') !== 'false',
                sourcePath:
                    configService.get('AUTO_DOC_SOURCE_PATH') || './src',
                delay: parseInt(configService.get('AUTO_DOC_DELAY') || '1000'),
            }),
            inject: [ConfigService],
        }),
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
```

#### 3.3 Manual Triggering

**File**: `backend/src/app.controller.ts`

```typescript
import { Controller, Get } from '@nestjs/common'
import { AppService } from './app.service'
import { AutoDocGenService } from '@auto-doc-gen/core'

@Controller()
export class AppController {
    constructor(
        private readonly appService: AppService,
        private readonly autoDocGenService: AutoDocGenService
    ) {}

    @Get()
    getHello(): string {
        return this.appService.getHello()
    }

    @Get('analyze')
    async analyzeProject() {
        await this.autoDocGenService.analyzeProject()
        return { message: 'Analysis completed' }
    }

    @Get('analysis-results')
    async getAnalysisResults() {
        return await this.autoDocGenService.getAnalysisResults()
    }
}
```

### Phase 4: Environment Configuration

#### 4.1 Environment Variables

**File**: `backend/.env`

```env
# AutoDocGen Configuration
AUTO_DOC_VERBOSE=true
AUTO_DOC_COLOR=true
AUTO_DOC_SOURCE_PATH=./src
AUTO_DOC_DELAY=2000
```

#### 4.2 Package.json Scripts

**File**: `backend/package.json` (additions)

```json
{
    "scripts": {
        "start:dev:with-docs": "AUTO_DOC_VERBOSE=true nest start --watch",
        "analyze": "npx @auto-doc-gen/core analyze ./src",
        "analyze:verbose": "npx @auto-doc-gen/core analyze ./src --verbose"
    }
}
```

### Phase 5: Expected Output

#### 5.1 Console Output on App Startup

```
[Nest] 12345  - 01/01/2024, 10:00:00 AM     LOG [AutoDocGenService] 🔍 Starting AutoDocGen analysis...

🔍 AutoDocGen Analysis Results
===============================

📁 Controllers Found: 2
📁 Services Found: 2

🎯 AppController (C:/backend/src/app.controller.ts)
   Base Path: /

   Methods:
   ├── GET /
   │   ├── Parameters: []
   │   └── Return Type: string

   ├── GET /analyze
   │   ├── Parameters: []
   │   └── Return Type: Promise<{ message: string }>

   └── GET /analysis-results
       ├── Parameters: []
       └── Return Type: Promise<AnalysisResults>

🎯 ProductsController (C:/backend/src/products/products.controller.ts)
   Base Path: /products

   Methods:
   ├── POST /products
   │   ├── Parameters: [body: CreateProductDto]
   │   └── Return Type: Product

   ├── GET /products
   │   ├── Parameters: []
   │   └── Return Type: Product[]

   ├── GET /products/:id
   │   ├── Parameters: [id: string]
   │   └── Return Type: Product

   ├── PATCH /products/:id
   │   ├── Parameters: [id: string, body: UpdateProductDto]
   │   └── Return Type: Product

   └── DELETE /products/:id
       ├── Parameters: [id: string]
       └── Return Type: { message: string }

🔧 AppService (C:/backend/src/app.service.ts)
   Dependencies: []

   Methods:
   ├── getHello()
   │   ├── Parameters: []
   │   └── Return Type: string

🔧 ProductsService (C:/backend/src/products/products.service.ts)
   Dependencies: []

   Methods:
   ├── create(createProductDto: CreateProductDto)
   │   ├── Parameters: [createProductDto: CreateProductDto]
   │   └── Return Type: Product

   ├── findAll()
   │   ├── Parameters: []
   │   └── Return Type: Product[]

   ├── findOne(id: string)
   │   ├── Parameters: [id: string]
   │   └── Return Type: Product | undefined

   ├── update(id: string, updateProductDto: UpdateProductDto)
   │   ├── Parameters: [id: string, updateProductDto: UpdateProductDto]
   │   └── Return Type: Product | undefined

   └── remove(id: string)
       ├── Parameters: [id: string]
       └── Return Type: boolean

📊 Summary:
   • Total Controllers: 2
   • Total Services: 2
   • Total Controller Methods: 7
   • Total Service Methods: 5
   • Analysis completed in 0.3s

[Nest] 12345  - 01/01/2024, 10:00:01 AM     LOG [AutoDocGenService] ✅ AutoDocGen analysis completed
```

## Implementation Steps

### Step 1: Create Integration Files

```bash
# Navigate to auto-doc-gen directory
cd auto-doc-gen

# Create integration directory
mkdir -p src/integration

# Create the files as specified above
```

### Step 2: Update Package Configuration

```bash
# Update package.json with peer dependencies
# Update src/index.ts with new exports
# Build the package
npm run build
```

### Step 3: Install in Backend

```bash
# Navigate to backend directory
cd ../backend

# Install the updated package
npm install ../auto-doc-gen

# Update app.module.ts with AutoDocGenModule
```

### Step 4: Test Integration

```bash
# Start the backend with auto-doc-gen
npm run start:dev

# Verify the analysis runs automatically
# Check console output for analysis results
```

## Benefits of This Integration

### ✅ Development Experience

-   **Automatic Documentation**: See your API structure every time you start the app
-   **Real-time Updates**: Analysis runs automatically when you add new controllers/services
-   **Zero Configuration**: Works out of the box with sensible defaults
-   **Team Onboarding**: New developers immediately see the project structure

### ✅ Production Ready

-   **Configurable**: Control when and how analysis runs
-   **Performance**: Minimal impact on app startup
-   **Error Handling**: Graceful failure if analysis encounters issues
-   **Environment Aware**: Different behavior for development vs production

### ✅ Flexible Usage

-   **CLI Still Available**: Keep existing CLI functionality
-   **Programmatic Access**: Use the service for custom analysis
-   **Manual Triggering**: Trigger analysis via API endpoints
-   **Configuration Options**: Full control over analysis behavior

## Migration Path

### From CLI to Integration

1. **Keep CLI**: Existing CLI usage continues to work
2. **Add Integration**: Import `AutoDocGenModule` in your app
3. **Configure**: Set options for automatic analysis
4. **Test**: Verify analysis runs on app startup
5. **Customize**: Adjust configuration as needed

### Backward Compatibility

-   ✅ All existing CLI commands work unchanged
-   ✅ All existing programmatic APIs work unchanged
-   ✅ All existing types and interfaces work unchanged
-   ✅ New integration is purely additive

## Troubleshooting

### Common Issues

#### Analysis Not Running

-   Check if `autoRun` is set to `true` (default)
-   Verify the module is imported in `app.module.ts`
-   Check console for error messages
-   Ensure source path exists and contains TypeScript files

#### Performance Issues

-   Increase `delay` option to allow more time for app initialization
-   Set `verbose: false` to reduce output
-   Consider running analysis only in development environment

#### Missing Controllers/Services

-   Verify files have proper NestJS decorators (`@Controller`, `@Injectable`)
-   Check file paths and ensure they're included in the analysis
-   Use `verbose: true` to see detailed file processing

## Next Steps

1. **Implement Integration Module**: Create the NestJS integration files
2. **Update Package**: Add new exports and peer dependencies
3. **Test Integration**: Verify it works with your backend
4. **Documentation**: Update README with integration examples
5. **Publish**: Make the package available for installation

---

**This integration transforms AutoDocGen from a standalone CLI tool into a powerful development companion that automatically documents your NestJS application structure every time you start your backend!**
