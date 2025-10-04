# AutoDocGen

A simple npm package that automatically analyzes NestJS controllers and services, generating comprehensive documentation with zero configuration.

## Features

-   🔍 **Controller Analysis**: Find and analyze all controllers with `@Controller()` decorator
-   🔧 **Service Analysis**: Find and analyze all services with `@Injectable()` decorator
-   📊 **Method Extraction**: Extract method signatures, parameters, return types, and decorators
-   🎨 **Colored Output**: Beautiful, structured console output with colors
-   ⚡ **Fast Analysis**: Quick analysis of NestJS projects
-   📄 **JSON Export**: Export analysis results to JSON format
-   🚀 **Auto Setup**: Automatically adds scripts and creates configuration

## Quick Start

### 1. Install the package

```bash
npm install @auto-doc-gen/core
```

### 2. Run setup (adds scripts and creates config)

```bash
npx auto-doc-gen setup
```

### 3. Generate documentation

```bash
npm run docs
```

That's it! Your documentation is now available in the `./docs` folder.

## Available Commands

After setup, you'll have these commands available:

```bash
npm run docs        # Generate documentation
npm run docs:analyze # Show analysis in console
npm run docs:info   # Quick summary
npm run docs:export # Export to JSON file
npm run docs:all    # Export multiple formats
```

## Manual CLI Usage

If you prefer to use the CLI directly:

```bash
# Basic analysis
npx auto-doc-gen analyze ./src

# With options
npx auto-doc-gen analyze ./src --verbose --no-color

# Quick info
npx auto-doc-gen info ./src

# Export to JSON
npx auto-doc-gen export ./src --output docs.json
```

### Programmatic Usage

```typescript
import { AutoDocGen } from '@auto-doc-gen/core'

const analyzer = new AutoDocGen({ verbose: true })
await analyzer.analyze('./src')
```

## Example Output

### Setup Output

```bash
🔧 Setting up AutoDocGen...
✅ Added 5 docs scripts to package.json
✅ Created autodocgen.config.json with NestJS defaults

🎉 AutoDocGen setup complete!

📋 Available commands:
   npm run docs        - Generate documentation
   npm run docs:analyze - Show analysis in console
   npm run docs:info   - Quick summary
   npm run docs:export - Export to JSON file
   npm run docs:all    - Export multiple formats

🔧 Configuration: Edit autodocgen.config.json to customize
📖 Next step: Run "npm run docs" to generate your first documentation
```

### Analysis Output

```bash
📊 Quick Analysis Results:
   Controllers: 2
   Services: 2
   Analysis time: 4.43s

🎯 Controllers:
   • AppController (3 methods)
   • ProductsController (5 methods)

🔧 Services:
   • AppService (1 methods)
   • ProductsService (5 methods)
```

### Generated Files

After running `npm run docs`, you'll get:

-   `./docs/api-documentation.json` - Complete analysis in JSON format
-   `./docs/` folder with organized documentation

## Configuration

The setup creates an `autodocgen.config.json` file with sensible defaults:

```json
{
    "sourcePath": "./src",
    "output": {
        "json": {
            "enabled": true,
            "pretty": true,
            "outputDir": "./docs",
            "filename": "api-documentation.json",
            "includeMetadata": true,
            "timestamp": true
        },
        "console": {
            "enabled": true,
            "verbose": false,
            "colorOutput": true
        }
    },
    "analysis": {
        "includeInterfaces": true,
        "includeClasses": true,
        "includeEnums": true,
        "includeValidationRules": true,
        "includeDecorators": true,
        "includeImports": true,
        "maxDepth": 5
    },
    "include": [
        "**/*.controller.ts",
        "**/*.service.ts",
        "**/*.dto.ts",
        "**/*.interface.ts",
        "**/*.enum.ts"
    ],
    "exclude": [
        "**/*.spec.ts",
        "**/*.test.ts",
        "**/node_modules/**",
        "**/dist/**"
    ]
}
```

## CLI Options

-   `--verbose`: Show detailed information during analysis
-   `--no-color`: Disable colored output
-   `--include-private`: Include private methods in analysis
-   `--output <path>`: Specify output file path
-   `--format <format>`: Output format (json, json-pretty)
-   `--config <path>`: Use custom config file

## License

MIT
