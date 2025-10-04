// Main exports for the AutoDocGen package
export { AutoDocGen } from './core/analyzer'
export { Logger } from './core/logger'
export { ControllerExtractor } from './extractors/controller-extractor'
export { ServiceExtractor } from './extractors/service-extractor'
export { FileUtils } from './utils/file-utils'

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
