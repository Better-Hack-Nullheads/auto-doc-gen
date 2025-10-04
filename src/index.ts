// Main exports for the AutoDocGen package
export { AutoDocGen } from './core/analyzer'
export { Logger } from './core/logger'
export { ControllerExtractor } from './extractors/controller-extractor'
export { ServiceExtractor } from './extractors/service-extractor'
export { FileUtils } from './utils/file-utils'

// Type exports
export type {
    MethodInfo,
    ParameterInfo,
    SimpleOptions,
} from './types/common.types'
export type { ControllerInfo } from './types/controller.types'
export type { ServiceInfo } from './types/service.types'
