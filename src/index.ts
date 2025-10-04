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
