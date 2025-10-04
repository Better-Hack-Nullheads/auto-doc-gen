# AutoDocGen - Simple NestJS Analyzer

A simple CLI tool to analyze NestJS projects and extract controller and service information.

## Features

-   **Console Analysis** - Display controllers and services in terminal
-   **JSON Export** - Save analysis results to JSON file
-   **Database Save** - Save analysis results to MongoDB

## Installation

```bash
npm install @auto-doc-gen/core
```

## Usage

### 1. Console Analysis

Display controllers and services in the terminal:

```bash
auto-doc-gen analyze <path>
```

Example:

```bash
auto-doc-gen analyze src
```

### 2. JSON Export

Export analysis results to a JSON file:

```bash
auto-doc-gen export <path> --output <file>
```

Example:

```bash
auto-doc-gen export src --output docs.json
```

### 3. Database Save

Save analysis results to MongoDB:

```bash
auto-doc-gen save <path> --db-url <connection-string>
```

Example:

```bash
auto-doc-gen save src --db-url "mongodb://localhost:27017/api_docs"
```

## Options

### Analyze Command

-   `-v, --verbose` - Show verbose output
-   `--no-color` - Disable colored output
-   `--include-private` - Include private methods

### Export Command

-   `-o, --output <path>` - Output file path (default: ./docs/analysis.json)
-   `-v, --verbose` - Show verbose output

### Save Command

-   `--db-url <url>` - MongoDB connection URL (required)
-   `-v, --verbose` - Show verbose output

## NPM Scripts

Add these scripts to your `package.json`:

```json
{
    "scripts": {
        "docs": "auto-doc-gen export src --output docs.json",
        "docs:analyze": "auto-doc-gen analyze src",
        "docs:save": "auto-doc-gen save src --db-url mongodb://localhost:27017/api_docs"
    }
}
```

Then run:

```bash
npm run docs          # Export to JSON
npm run docs:analyze  # Show in console
npm run docs:save     # Save to database
```

## Output Format

### Console Output

-   Controllers with methods and decorators
-   Services with methods
-   Summary statistics

### JSON Output

-   Metadata (generation time, version, etc.)
-   Controllers array with methods and parameters
-   Services array with methods
-   Types array (interfaces, classes, enums)
-   Summary statistics

### Database Storage

-   Documentation collection with analysis metadata
-   Endpoints collection with API endpoint details
-   Types collection with type schemas

## Requirements

-   Node.js >= 16.0.0
-   TypeScript project with NestJS decorators
-   MongoDB (for database save feature)

## License

MIT
