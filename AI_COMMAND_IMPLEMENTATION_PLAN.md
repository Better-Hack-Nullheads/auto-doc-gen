# AI Command Implementation Action Plan

## Overview

Create a new `ai` command for the AutoDocGen package that processes the analysis data (controllers, services, types) and sends it to an AI service for intelligent documentation generation, using the same data structure as the existing `save` command. The system will be designed with extensibility in mind to support multiple AI providers and customizable models.

## 1. Dependencies & Setup

### 1.1 Add Required Dependencies

-   **AI SDK**: `ai` package for AI integration
-   **Zod**: `zod` package for schema validation
-   **Google AI**: `@ai-sdk/google` for Google's AI models
-   **OpenAI**: `@ai-sdk/openai` for OpenAI models (future)
-   **Anthropic**: `@ai-sdk/anthropic` for Claude models (future)

```json
{
    "dependencies": {
        "ai": "^3.0.0",
        "zod": "^3.22.0",
        "@ai-sdk/google": "^1.0.0",
        "@ai-sdk/openai": "^1.0.0",
        "@ai-sdk/anthropic": "^1.0.0"
    }
}
```

### 1.2 Environment Variables

Add support for multiple AI providers:

-   `GOOGLE_AI_API_KEY` - Google AI API key
-   `OPENAI_API_KEY` - OpenAI API key (future)
-   `ANTHROPIC_API_KEY` - Anthropic API key (future)
-   `AI_PROVIDER` - Default provider (google, openai, anthropic)
-   `AI_MODEL` - Default model selection

## 2. Schema Definition

### 2.1 AI Response Schema (Zod)

Based on the actual analysis data structure from `analysis-2025-10-04-compact.json`, create a comprehensive schema:

```typescript
// src/types/ai.types.ts
export const AIAnalysisSchema = z.object({
    projectOverview: z.object({
        name: z.string(),
        description: z.string(),
        architecture: z.string(),
        technologyStack: z.array(z.string()),
        complexity: z.enum(['simple', 'medium', 'complex']),
        totalFiles: z.number(),
        totalControllers: z.number(),
        totalServices: z.number(),
        totalMethods: z.number(),
        totalTypes: z.number(),
    }),
    controllers: z.array(
        z.object({
            name: z.string(),
            filePath: z.string(),
            basePath: z.string().optional(),
            purpose: z.string(),
            endpoints: z.array(
                z.object({
                    name: z.string(),
                    path: z.string(),
                    method: z.string(),
                    description: z.string(),
                    parameters: z.array(
                        z.object({
                            name: z.string(),
                            type: z.string(),
                            decorator: z.string().optional(),
                            optional: z.boolean(),
                            description: z.string(),
                        })
                    ),
                    returnType: z.string(),
                    decorators: z.array(z.string()),
                    isPublic: z.boolean(),
                    examples: z.array(z.string()).optional(),
                })
            ),
        })
    ),
    services: z.array(
        z.object({
            name: z.string(),
            filePath: z.string(),
            purpose: z.string(),
            dependencies: z.array(z.string()),
            methods: z.array(
                z.object({
                    name: z.string(),
                    description: z.string(),
                    parameters: z.array(
                        z.object({
                            name: z.string(),
                            type: z.string(),
                            optional: z.boolean(),
                            description: z.string(),
                        })
                    ),
                    returnType: z.string(),
                    decorators: z.array(z.string()),
                    isPublic: z.boolean(),
                    businessLogic: z.string().optional(),
                })
            ),
        })
    ),
    dataModels: z.array(
        z.object({
            name: z.string(),
            type: z.enum(['class', 'interface', 'enum', 'type']),
            filePath: z.string(),
            definition: z.string(),
            description: z.string(),
            properties: z.array(
                z.object({
                    name: z.string(),
                    type: z.string(),
                    optional: z.boolean(),
                    decorators: z.array(z.string()),
                    validationRules: z.array(z.any()),
                    defaultValue: z.string().optional(),
                })
            ),
            methods: z.array(z.any()).optional(),
            decorators: z.array(z.string()),
            imports: z.array(
                z.object({
                    name: z.string(),
                    from: z.string(),
                    isDefault: z.boolean(),
                    isNamespace: z.boolean(),
                })
            ),
            exports: z.array(z.string()),
            dependencies: z.array(z.string()),
            validationRules: z.array(z.any()),
        })
    ),
    recommendations: z.array(
        z.object({
            category: z.enum([
                'security',
                'performance',
                'architecture',
                'documentation',
                'code-quality',
                'best-practices',
            ]),
            priority: z.enum(['low', 'medium', 'high']),
            description: z.string(),
            suggestion: z.string(),
            affectedComponents: z.array(z.string()).optional(),
        })
    ),
})
```

## 3. AI Service Implementation

### 3.1 AI Provider Interface

```typescript
// src/types/ai.types.ts
export interface AIProvider {
    name: string
    models: string[]
    createModel(modelName: string, apiKey: string): any
    getProviderOptions(): any
}

export interface AIConfig {
    provider: 'google' | 'openai' | 'anthropic'
    model: string
    apiKey: string
    temperature?: number
    maxTokens?: number
    customPrompt?: string
}
```

### 3.2 Provider Implementations

```typescript
// src/services/providers/google-provider.ts
export class GoogleProvider implements AIProvider {
    name = 'google'
    models = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-1.5-flash']

    createModel(modelName: string, apiKey: string) {
        return google(modelName, { apiKey })
    }

    getProviderOptions() {
        return {
            google: {
                structuredOutputs: true,
            },
        }
    }
}

// src/services/providers/openai-provider.ts
export class OpenAIProvider implements AIProvider {
    name = 'openai'
    models = ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo']

    createModel(modelName: string, apiKey: string) {
        return openai(modelName, { apiKey })
    }

    getProviderOptions() {
        return {
            openai: {
                structuredOutputs: true,
            },
        }
    }
}
```

### 3.3 Main AI Service Class

```typescript
// src/services/ai-service.ts
export class AIService {
    private provider: AIProvider
    private model: any
    private schema: z.ZodSchema
    private config: AIConfig

    constructor(config: AIConfig) {
        this.config = config
        this.provider = this.createProvider(config.provider)
        this.model = this.provider.createModel(config.model, config.apiKey)
        this.schema = AIAnalysisSchema
    }

    async analyzeProject(
        analysisData: JsonAnalysisResult
    ): Promise<AIAnalysis> {
        const prompt = this.buildPrompt(analysisData)

        const { object } = await generateObject({
            model: this.model,
            schema: this.schema,
            prompt,
            providerOptions: this.provider.getProviderOptions(),
            temperature: this.config.temperature || 0.7,
            maxTokens: this.config.maxTokens || 4000,
        })

        return object
    }

    private createProvider(providerName: string): AIProvider {
        switch (providerName) {
            case 'google':
                return new GoogleProvider()
            case 'openai':
                return new OpenAIProvider()
            case 'anthropic':
                return new AnthropicProvider()
            default:
                throw new Error(`Unsupported AI provider: ${providerName}`)
        }
    }

    private buildPrompt(analysisData: JsonAnalysisResult): string {
        // Build comprehensive prompt from analysis data
        // Include controllers, services, types, and metadata
        // Use custom prompt if provided in config
        return this.config.customPrompt || this.getDefaultPrompt(analysisData)
    }

    private getDefaultPrompt(analysisData: JsonAnalysisResult): string {
        // Default prompt template
    }
}
```

### 3.4 Prompt Engineering

Create intelligent prompts that:

-   Analyze the project structure and architecture
-   Generate meaningful descriptions for controllers and services
-   Identify patterns and suggest improvements
-   Create comprehensive API documentation
-   Provide security and performance recommendations

#### 3.4.1 Customizable Prompt Templates

```typescript
// src/utils/prompt-templates.ts
export class PromptTemplates {
    static getDefaultTemplate(): string {
        return `
        Analyze this NestJS project and provide comprehensive documentation:
        
        Project Metadata:
        - Total Files: {{totalFiles}}
        - Controllers: {{totalControllers}}
        - Services: {{totalServices}}
        - Methods: {{totalMethods}}
        - Types: {{totalTypes}}
        
        Controllers: {{controllers}}
        Services: {{services}}
        Data Models: {{types}}
        
        Please provide:
        1. Project overview and architecture analysis
        2. Detailed controller and endpoint documentation
        3. Service layer analysis and business logic insights
        4. Data model documentation with validation rules
        5. Security, performance, and best practice recommendations
        `
    }

    static getSecurityFocusedTemplate(): string {
        return `
        Focus on security analysis for this NestJS project:
        {{projectData}}
        
        Provide security recommendations for:
        - Authentication and authorization
        - Input validation
        - Data protection
        - API security best practices
        `
    }

    static getPerformanceFocusedTemplate(): string {
        return `
        Analyze performance aspects of this NestJS project:
        {{projectData}}
        
        Focus on:
        - Database query optimization
        - Caching strategies
        - API response optimization
        - Memory usage patterns
        `
    }
}
```

## 4. CLI Command Implementation

### 4.1 Add AI Command to CLI

```typescript
// Add to src/cli.ts
program
    .command('ai')
    .description(
        'Analyze project with AI and generate intelligent documentation'
    )
    .argument('<path>', 'Path to the NestJS project source directory')
    .option(
        '--provider <provider>',
        'AI provider (google, openai, anthropic)',
        'google'
    )
    .option('--model <model>', 'AI model to use')
    .option('--api-key <key>', 'AI API key (overrides config)')
    .option('--temperature <temp>', 'AI temperature (0.0-1.0)', '0.7')
    .option('--max-tokens <tokens>', 'Maximum tokens for response', '4000')
    .option(
        '--template <template>',
        'Prompt template (default, security, performance)',
        'default'
    )
    .option('--custom-prompt <prompt>', 'Custom prompt template')
    .option('--output <path>', 'Output file path for AI analysis')
    .option('-v, --verbose', 'Show verbose output')
    .action(async (path: string, options: any) => {
        // Implementation
    })
```

### 4.2 Command Flow

1. Load configuration
2. Run analysis (reuse existing analyzer)
3. Process data through AI service
4. Output results (console + optional file)
5. Handle errors gracefully

## 5. Configuration Updates

### 5.1 Extend Config Schema

```typescript
// Update src/config/config-loader.ts
export interface AutoDocGenConfig {
    // ... existing config
    ai: {
        enabled: boolean
        provider: 'google' | 'openai' | 'anthropic'
        model: string
        apiKey?: string
        temperature?: number
        maxTokens?: number
        outputDir: string
        filename: string
        templates: {
            default: string
            security: string
            performance: string
            custom?: string
        }
        providers: {
            google: {
                models: string[]
                defaultModel: string
            }
            openai: {
                models: string[]
                defaultModel: string
            }
            anthropic: {
                models: string[]
                defaultModel: string
            }
        }
    }
}
```

### 5.2 Default Configuration

```json
{
    "ai": {
        "enabled": true,
        "provider": "google",
        "model": "gemini-2.5-flash",
        "temperature": 0.7,
        "maxTokens": 4000,
        "outputDir": "./docs",
        "filename": "ai-analysis.json",
        "templates": {
            "default": "comprehensive",
            "security": "security-focused",
            "performance": "performance-focused"
        },
        "providers": {
            "google": {
                "models": [
                    "gemini-2.5-flash",
                    "gemini-2.5-pro",
                    "gemini-1.5-flash"
                ],
                "defaultModel": "gemini-2.5-flash"
            },
            "openai": {
                "models": ["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"],
                "defaultModel": "gpt-4o"
            },
            "anthropic": {
                "models": [
                    "claude-3-5-sonnet",
                    "claude-3-haiku",
                    "claude-3-opus"
                ],
                "defaultModel": "claude-3-5-sonnet"
            }
        }
    }
}
```

## 6. File Structure

### 6.1 New Files to Create

```
src/
├── services/
│   ├── ai-service.ts          # Main AI service implementation
│   └── providers/
│       ├── google-provider.ts
│       ├── openai-provider.ts
│       └── anthropic-provider.ts
├── types/
│   └── ai.types.ts           # AI-related type definitions
└── utils/
    ├── prompt-templates.ts    # Prompt template system
    └── ai-config-validator.ts # AI configuration validation
```

### 6.2 Updated Files

-   `src/cli.ts` - Add AI command
-   `src/index.ts` - Export AI service
-   `src/config/config-loader.ts` - Add AI configuration
-   `package.json` - Add dependencies

## 7. Implementation Steps

### Phase 1: Core Setup

1. ✅ Add dependencies to package.json
2. ✅ Create AI types and schemas
3. ✅ Implement basic AI service class
4. ✅ Add AI configuration support

### Phase 2: CLI Integration

1. ✅ Add AI command to CLI
2. ✅ Implement command logic
3. ✅ Add error handling and validation
4. ✅ Test basic functionality

### Phase 3: Enhancement

1. ✅ Improve prompt engineering
2. ✅ Add output formatting options
3. ✅ Implement caching for repeated requests
4. ✅ Add comprehensive error handling

### Phase 4: Testing & Documentation

1. ✅ Test with sample projects
2. ✅ Update documentation
3. ✅ Add usage examples
4. ✅ Performance optimization

## 8. Usage Examples

### 8.1 Basic Usage

```bash
# Using config file with default Google provider
auto-doc-gen ai src

# With different provider
auto-doc-gen ai src --provider openai --model "gpt-4o"

# With API key override
auto-doc-gen ai src --api-key "your-api-key"

# With custom model and temperature
auto-doc-gen ai src --model "gemini-2.5-pro" --temperature 0.5

# With specific prompt template
auto-doc-gen ai src --template security

# With custom prompt
auto-doc-gen ai src --custom-prompt "Focus on performance analysis"

# With output file
auto-doc-gen ai src --output "./docs/ai-analysis.json"

# Full customization example
auto-doc-gen ai src \
  --provider anthropic \
  --model "claude-3-5-sonnet" \
  --temperature 0.3 \
  --max-tokens 6000 \
  --template performance \
  --output "./docs/performance-analysis.json"
```

### 8.2 Expected Output

-   Console: Real-time progress and summary
-   File: Comprehensive AI analysis in JSON format
-   Features: Project overview, endpoint documentation, recommendations

## 9. Error Handling

### 9.1 Common Scenarios

-   Missing API key
-   Invalid model selection
-   Network connectivity issues
-   AI service rate limits
-   Malformed analysis data

### 9.2 Graceful Degradation

-   Fallback to basic analysis if AI fails
-   Clear error messages with suggestions
-   Retry mechanisms for transient failures

## 10. Future Enhancements

### 10.1 Potential Features

-   ✅ Multiple AI provider support (Google, OpenAI, Anthropic)
-   ✅ Custom prompt templates and templates system
-   ✅ Configurable AI parameters (temperature, max tokens)
-   ✅ Provider-specific model selection
-   Integration with existing documentation tools
-   Real-time analysis updates
-   Team collaboration features
-   AI response caching system
-   Batch processing for multiple projects
-   Custom AI model fine-tuning support

### 10.2 Performance Optimizations

-   Caching AI responses
-   Batch processing for large projects
-   Incremental analysis updates
-   Background processing support

---

## Key Customization Features

### 🎯 **Multi-Provider Support**

-   **Google AI**: Gemini models (2.5-flash, 2.5-pro, 1.5-flash)
-   **OpenAI**: GPT models (gpt-4o, gpt-4o-mini, gpt-3.5-turbo)
-   **Anthropic**: Claude models (claude-3-5-sonnet, claude-3-haiku, claude-3-opus)

### 🔧 **Configurable Parameters**

-   **Temperature**: Control creativity (0.0-1.0)
-   **Max Tokens**: Limit response length
-   **Custom Prompts**: User-defined analysis focus
-   **Template System**: Pre-built analysis templates

### 📊 **Data Structure Alignment**

-   Based on actual `analysis-2025-10-04-compact.json` structure
-   Includes all metadata, controllers, services, and types
-   Supports validation rules and decorators
-   Handles imports, exports, and dependencies

### 🚀 **Extensible Architecture**

-   Provider interface for easy addition of new AI services
-   Template system for customizable analysis focus
-   Configuration-driven model selection
-   Future-ready for additional providers

## Approval Required

This enhanced action plan covers:

-   ✅ **Dependencies**: AI SDK, Zod, Multi-provider support
-   ✅ **Schema**: Based on actual analysis data structure
-   ✅ **Implementation**: Extensible AI service with provider pattern
-   ✅ **Configuration**: Comprehensive AI configuration system
-   ✅ **Customization**: Multiple providers, models, and templates
-   ✅ **Error Handling**: Comprehensive error management
-   ✅ **Testing**: Phased implementation approach

**Ready for implementation?** Please approve this enhanced plan and I'll proceed with the implementation following the outlined phases.
