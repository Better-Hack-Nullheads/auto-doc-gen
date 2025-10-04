# User Guide

## Commands

### `analyze` - Full Analysis

```bash
auto-doc-gen analyze <path> [options]
```

**Options:**

-   `--verbose` - Show detailed processing
-   `--no-color` - Disable colored output
-   `--include-private` - Include private methods

### `info` - Quick Summary

```bash
auto-doc-gen info <path>
```

## Programmatic Usage

```typescript
import { AutoDocGen } from '@auto-doc-gen/core'

// Basic usage
const analyzer = new AutoDocGen()
await analyzer.analyze('./src')

// Get results as data
const results = await analyzer.getAnalysisResults('./src')
console.log(`Found ${results.controllers.length} controllers`)
```

## What Gets Analyzed

### Controllers

-   Classes with `@Controller()` decorator
-   HTTP methods (`@Get()`, `@Post()`, etc.)
-   Route parameters and paths
-   Method parameters and return types

### Services

-   Classes with `@Injectable()` decorator
-   Constructor dependencies
-   Public methods and signatures

## Troubleshooting

**No controllers/services found?**

-   Check decorators are properly imported
-   Use `--verbose` to see what files are being processed

**Parsing errors?**

-   Fix TypeScript compilation errors first
-   Check for syntax issues

That's all you need to know!
