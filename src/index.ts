// Main exports for the AutoDocGen package
export { AutoDocGen } from './core/analyzer'
export { Logger } from './core/logger'
export { ControllerExtractor } from './extractors/controller-extractor'
export { DtoExtractor } from './extractors/dto-extractor'
export { ServiceExtractor } from './extractors/service-extractor'
export { TypeExtractor } from './extractors/type-extractor'
export { FileUtils } from './utils/file-utils'

// NEW: JSON Export functionality
export { FileOrganizer } from './exporters/file-organizer'
export { JsonExporter } from './exporters/json-exporter'

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
export type { AutoDocGenOptions } from './types/integration.types'
export type { ServiceInfo } from './types/service.types'

// NEW: JSON Output types
export type {
    AnalysisMetadata,
    ExtractedType,
    ImportInfo,
    JsonAnalysisResult,
    JsonOutputOptions,
    PropertyInfo,
    ValidationRule,
} from './types/json-output.types'

// NEW: Enhanced method types
export type {
    EnhancedMethodInfo,
    TypeInfo,
} from './types/enhanced-method.types'

// NEW: Type extraction types
export type { TypeExtractionOptions } from './types/type-extraction.types'
