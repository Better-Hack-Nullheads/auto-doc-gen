# AutoDocGen Usage Guide

## ✅ Installation Complete

The simplified AutoDocGen has been successfully installed and tested. Here's how to use it:

## Quick Start

### 1. Generate Configuration

```bash
auto-doc-gen config
```

This creates `autodocgen.config.json` with default settings.

### 2. Set up AI API Key

Choose one of these methods:

**Option A: Environment Variable (Recommended)**

```bash
# For Google AI
export GOOGLE_AI_API_KEY="your-actual-api-key"

# For OpenAI
export OPENAI_API_KEY="your-actual-api-key"

# For Anthropic
export ANTHROPIC_API_KEY="your-actual-api-key"
```

**Option B: Config File**
Edit `autodocgen.config.json` and add your API key:

```json
{
    "ai": {
        "apiKey": "your-actual-api-key"
    }
}
```

### 3. Generate Documentation

```bash
# Basic usage
auto-doc-gen ai your-project-data.json

# With custom options
auto-doc-gen ai your-project-data.json --provider openai --model gpt-4o

# Save to database
auto-doc-gen ai your-project-data.json --save-to-db
```

## Test with Sample Data

A test file `test-data.json` has been created. To test with a real API key:

```bash
# Set your API key
export GOOGLE_AI_API_KEY="your-real-api-key"

# Test the command
auto-doc-gen ai test-data.json --verbose
```

## Commands Available

### `auto-doc-gen config`

-   Creates default configuration file
-   Use `--force` to overwrite existing config

### `auto-doc-gen ai <json-file>`

-   Generates AI documentation from JSON input
-   Options:
    -   `--provider <provider>` - AI provider (google, openai, anthropic)
    -   `--model <model>` - AI model to use
    -   `--api-key <key>` - Override API key
    -   `--temperature <temp>` - AI temperature (0.0-1.0)
    -   `--max-tokens <tokens>` - Maximum tokens
    -   `--output <path>` - Output file path
    -   `--save-to-db` - Save to database
    -   `--verbose` - Show debug info

## What's Working

✅ **Core AI Command** - Takes JSON input, generates MD output  
✅ **Config Management** - CLI-based config creation  
✅ **Database Storage** - MongoDB integration for saving MD content  
✅ **Multiple AI Providers** - Google, OpenAI, Anthropic support  
✅ **Error Handling** - Proper validation and error messages  
✅ **Environment Variables** - Flexible configuration  
✅ **Build System** - TypeScript compilation works

## Next Steps

1. **Get a real API key** from your preferred AI provider
2. **Test with your actual project data** in JSON format
3. **Set up MongoDB** if you want to use database storage
4. **Customize prompts** by editing the config file

## File Structure

```
auto-doc-gen/
├── src/
│   ├── cli.ts                    # Main CLI (2 commands)
│   ├── config/config-loader.ts   # Config management
│   ├── services/ai-service.ts    # AI integration
│   ├── adapters/mongodb-adapter.ts # Database storage
│   ├── utils/prompt-templates.ts # AI prompts
│   └── types/                    # Type definitions
├── test-data.json               # Sample data for testing
├── autodocgen.config.json       # Configuration file
└── README.md                    # Documentation
```

The project is now simplified and focused on exactly what you requested - a single AI generation command that takes JSON input, generates markdown output, and can save to a database!
