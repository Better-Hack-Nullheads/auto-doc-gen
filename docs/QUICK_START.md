# AutoDocGen - Quick Start Guide

## What is AutoDocGen?

AutoDocGen automatically analyzes and displays your NestJS controllers and services when your app starts. No more manual documentation - it just works!

## Installation

```bash
npm install @auto-doc-gen/core
```

## Basic Setup (2 steps)

### Step 1: Import the Module

Add `AutoDocGenModule` to your `app.module.ts`:

```typescript
import { Module } from '@nestjs/common'
import { AutoDocGenModule } from '@auto-doc-gen/core'
// ... your other imports

@Module({
    imports: [
        // ... your other modules
        AutoDocGenModule.forRoot({
            autoRun: true, // Run analysis on app startup
            verbose: true, // Show detailed output
            colorOutput: true, // Use colors in console
            sourcePath: './src', // Path to analyze
            delay: 2000, // Wait 2 seconds after app starts
        }),
    ],
    // ... rest of your module
})
export class AppModule {}
```

### Step 2: Start Your App

```bash
npm run start:dev
```

**That's it!** You'll see your API structure automatically printed in the console.

## What You'll See

```
🔍 AutoDocGen Analysis Results
================================

📁 Controllers Found: 2
📁 Services Found: 2

🎯 AppController (C:/your-project/src/app.controller.ts)
   Methods:
   ├── GET /
   │   └── Return Type: string

🎯 ProductsController (C:/your-project/src/products/products.controller.ts)
   Methods:
   ├── POST /products
   │   ├── Parameters: [body: CreateProductDto]
   │   └── Return Type: Product
   ├── GET /products
   │   └── Return Type: Product[]

🔧 AppService (C:/your-project/src/app.service.ts)
   Methods:
   ├── getHello()
   │   └── Return Type: string

📊 Summary:
   • Total Controllers: 2
   • Total Services: 2
   • Analysis completed in 0.3s
```

## Optional: Manual Analysis Endpoints

Add these to your controller for manual analysis:

```typescript
import { Controller, Get } from '@nestjs/common'
import { AutoDocGenService } from '@auto-doc-gen/core'

@Controller()
export class AppController {
    constructor(private readonly autoDocGenService: AutoDocGenService) {}

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

Then visit:

-   `http://localhost:3000/analyze` - Trigger analysis manually
-   `http://localhost:3000/analysis-results` - Get analysis as JSON

## Configuration Options

```typescript
AutoDocGenModule.forRoot({
    autoRun: true, // Run on startup (default: true)
    verbose: false, // Detailed output (default: false)
    colorOutput: true, // Colored console (default: true)
    includePrivate: false, // Include private methods (default: false)
    sourcePath: './src', // Path to analyze (default: './src')
    delay: 1000, // Delay before analysis in ms (default: 1000)
})
```

## Environment-Based Configuration

```typescript
import { ConfigModule, ConfigService } from '@nestjs/config'

@Module({
    imports: [
        ConfigModule.forRoot(),
        AutoDocGenModule.forRootAsync({
            useFactory: (configService: ConfigService) => ({
                autoRun: configService.get('NODE_ENV') === 'development',
                verbose: configService.get('AUTO_DOC_VERBOSE') === 'true',
                sourcePath:
                    configService.get('AUTO_DOC_SOURCE_PATH') || './src',
            }),
            inject: [ConfigService],
        }),
    ],
})
export class AppModule {}
```

## CLI Usage (Still Available)

```bash
# Analyze your project manually
npx @auto-doc-gen/core analyze ./src

# Quick summary
npx @auto-doc-gen/core info ./src

# Verbose output
npx @auto-doc-gen/core analyze ./src --verbose
```

## Troubleshooting

**Analysis not running?**

-   Check if `autoRun: true` in your module config
-   Verify the module is imported in `app.module.ts`
-   Check console for error messages

**Missing controllers/services?**

-   Ensure files have `@Controller()` or `@Injectable()` decorators
-   Check that `sourcePath` points to the right directory
-   Use `verbose: true` to see detailed processing

**Performance issues?**

-   Increase `delay` option (try 3000-5000ms)
-   Set `verbose: false` to reduce output
-   Run only in development: `autoRun: process.env.NODE_ENV === 'development'`

## That's It!

Your NestJS app now automatically documents itself every time you start it. Perfect for development, team onboarding, and keeping your API structure visible.

---

**Need more details?** Check the full [Backend Integration Plan](./BACKEND_INTEGRATION_PLAN.md)
