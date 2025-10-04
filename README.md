# AutoDocGen - Simple AI Documentation Generator

A simple AI-powered documentation generator that takes JSON input and generates markdown documentation using AI.

## Features

-   **Core AI Command**: Generate documentation from JSON input using AI
-   **Config Management**: Create and manage configuration via CLI
-   **Database Storage**: Save generated documentation to MongoDB
-   **Multiple AI Providers**: Support for Google, OpenAI, and Anthropic

## Installation

```bash
npm install -g @auto-doc-gen/core
```

## Quick Start

### 1. Generate Configuration

```bash
auto-doc-gen config
```

This creates `autodocgen.config.json` with default settings.

### 2. Set up AI API Key

Set your AI provider API key as an environment variable:

```bash
# For Google AI
export GOOGLE_AI_API_KEY="your-api-key"

# For OpenAI
export OPENAI_API_KEY="your-api-key"

# For Anthropic
export ANTHROPIC_API_KEY="your-api-key"
```

### 3. Generate Documentation

```bash
# Basic usage
auto-doc-gen ai input.json

# With custom options
auto-doc-gen ai input.json --provider openai --model gpt-4o --output docs/my-docs.md

# Save to database
auto-doc-gen ai input.json --save-to-db
```

## Commands

### `auto-doc-gen config`

Generate default configuration file.

**Options:**

-   `-f, --force` - Overwrite existing config file

### `auto-doc-gen ai <json-file>`

Generate AI documentation from JSON input.

**Options:**

-   `--provider <provider>` - AI provider (google, openai, anthropic)
-   `--model <model>` - AI model to use
-   `--api-key <key>` - AI API key (overrides config)
-   `--temperature <temp>` - AI temperature (0.0-1.0)
-   `--max-tokens <tokens>` - Maximum tokens for response
-   `--output <path>` - Output file path for AI analysis
-   `--save-to-db` - Save generated documentation to database
-   `-v, --verbose` - Show verbose output

## Configuration

Edit `autodocgen.config.json` to customize settings:

```json
{
    "database": {
        "type": "mongodb",
        "url": "mongodb://localhost:27017/api_docs",
        "database": "api_docs"
    },
    "ai": {
        "enabled": true,
        "provider": "google",
        "model": "gemini-2.5-flash",
        "temperature": 0.7,
        "maxTokens": 16000,
        "outputDir": "./docs",
        "filename": "ai-analysis.md"
    }
}
```

## Environment Variables

You can override config settings with environment variables:

-   `GOOGLE_AI_API_KEY` - Google AI API key
-   `OPENAI_API_KEY` - OpenAI API key
-   `ANTHROPIC_API_KEY` - Anthropic API key
-   `AUTODOCGEN_AI_PROVIDER` - AI provider
-   `AUTODOCGEN_AI_MODEL` - AI model
-   `AUTODOCGEN_AI_TEMPERATURE` - AI temperature
-   `AUTODOCGEN_AI_MAX_TOKENS` - Maximum tokens

## Database Storage

When using `--save-to-db`, the generated documentation is saved to MongoDB with the following structure:

```javascript
{
    content: "Generated markdown content",
    source: "input.json",
    provider: "google",
    model: "gemini-2.5-flash",
    timestamp: "2024-01-01T00:00:00.000Z",
    metadata: {
        temperature: 0.7,
        maxTokens: 16000
    },
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z"
}
```

## Examples

### Basic Usage

```bash
# Generate config
auto-doc-gen config

# Generate documentation
auto-doc-gen ai project-data.json
```

### Advanced Usage

```bash
# Use OpenAI with custom settings
auto-doc-gen ai project-data.json \
  --provider openai \
  --model gpt-4o \
  --temperature 0.5 \
  --max-tokens 8000 \
  --output docs/api-docs.md \
  --save-to-db
```

## License

MIT
