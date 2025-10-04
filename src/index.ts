// Main exports for the AutoDocGen package
export { AutoDocGen } from './core/analyzer'
export { Logger } from './core/logger'
export { ControllerExtractor } from './extractors/controller-extractor'
export { ServiceExtractor } from './extractors/service-extractor'
export { TypeExtractor } from './extractors/type-extractor'
export { FileUtils } from './utils/file-utils'

// JSON Export functionality
export { JsonExporter } from './exporters/json-exporter'

// Database integration
export { MongoDBAdapter } from './adapters/mongodb-adapter'

// AI integration
export { AIService } from './services/ai-service'
export { AnthropicProvider } from './services/providers/anthropic-provider'
export { GoogleProvider } from './services/providers/google-provider'
export { OpenAIProvider } from './services/providers/openai-provider'
export { PromptTemplates } from './utils/prompt-templates'

// Type exports
export type {
    MethodInfo,
    ParameterInfo,
    SimpleOptions,
} from './types/common.types'
export type { ControllerInfo } from './types/controller.types'
export type { ServiceInfo } from './types/service.types'

// Database types
export type { DatabaseConfig } from './types/database.types'

// AI types
export type {
    AIAnalysis,
    AIConfig,
    AIProvider,
    AutoDocGenAIConfig,
} from './types/ai.types'

// Configuration types
export { ConfigLoader } from './config/config-loader'
export type { AutoDocGenConfig } from './config/config-loader'
