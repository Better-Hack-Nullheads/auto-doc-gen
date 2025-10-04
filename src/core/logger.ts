import chalk from 'chalk'
import { SimpleOptions } from '../types/common.types'
import { ControllerInfo } from '../types/controller.types'
import { ServiceInfo } from '../types/service.types'

export class Logger {
    private options: SimpleOptions

    constructor(options: SimpleOptions) {
        this.options = options
    }

    /**
     * Log analysis results with controllers and services
     */
    logResults(
        controllers: ControllerInfo[],
        services: ServiceInfo[],
        analysisTime: number
    ): void {
        this.logHeader()
        this.logSummary(controllers, services, analysisTime)
        this.logControllers(controllers)
        this.logServices(services)
    }

    /**
     * Log the main header
     */
    private logHeader(): void {
        if (this.options.colorOutput) {
            console.log(chalk.blue.bold('🔍 AutoDocGen Analysis Results'))
            console.log(chalk.gray('================================'))
        } else {
            console.log('🔍 AutoDocGen Analysis Results')
            console.log('================================')
        }
        console.log()
    }

    /**
     * Log summary statistics
     */
    private logSummary(
        controllers: ControllerInfo[],
        services: ServiceInfo[],
        analysisTime: number
    ): void {
        const totalControllerMethods = controllers.reduce(
            (sum, c) => sum + c.methods.length,
            0
        )
        const totalServiceMethods = services.reduce(
            (sum, s) => sum + s.methods.length,
            0
        )

        if (this.options.colorOutput) {
            console.log(
                chalk.green(`📁 Controllers Found: ${controllers.length}`)
            )
            console.log(chalk.green(`📁 Services Found: ${services.length}`))
            console.log()
        } else {
            console.log(`📁 Controllers Found: ${controllers.length}`)
            console.log(`📁 Services Found: ${services.length}`)
            console.log()
        }
    }

    /**
     * Log all controllers
     */
    logControllers(controllers: ControllerInfo[]): void {
        for (const controller of controllers) {
            this.logController(controller)
        }
    }

    /**
     * Log a single controller
     */
    private logController(controller: ControllerInfo): void {
        const controllerName = this.options.colorOutput
            ? chalk.yellow.bold(`🎯 ${controller.name}`)
            : `🎯 ${controller.name}`

        const filePath = this.options.colorOutput
            ? chalk.gray(`(${controller.filePath})`)
            : `(${controller.filePath})`

        console.log(`${controllerName} ${filePath}`)

        if (controller.basePath) {
            const basePath = this.options.colorOutput
                ? chalk.cyan(`   Base Path: ${controller.basePath}`)
                : `   Base Path: ${controller.basePath}`
            console.log(basePath)
        }

        console.log()
        console.log('   Methods:')

        for (let i = 0; i < controller.methods.length; i++) {
            const method = controller.methods[i]
            const isLast = i === controller.methods.length - 1
            this.logMethod(method, isLast, 'controller')
        }

        console.log()
    }

    /**
     * Log all services
     */
    logServices(services: ServiceInfo[]): void {
        for (const service of services) {
            this.logService(service)
        }
    }

    /**
     * Log a single service
     */
    private logService(service: ServiceInfo): void {
        const serviceName = this.options.colorOutput
            ? chalk.magenta.bold(`🔧 ${service.name}`)
            : `🔧 ${service.name}`

        const filePath = this.options.colorOutput
            ? chalk.gray(`(${service.filePath})`)
            : `(${service.filePath})`

        console.log(`${serviceName} ${filePath}`)

        if (service.dependencies.length > 0) {
            const dependencies = this.options.colorOutput
                ? chalk.cyan(
                      `   Dependencies: [${service.dependencies.join(', ')}]`
                  )
                : `   Dependencies: [${service.dependencies.join(', ')}]`
            console.log(dependencies)
        }

        console.log()
        console.log('   Methods:')

        for (let i = 0; i < service.methods.length; i++) {
            const method = service.methods[i]
            const isLast = i === service.methods.length - 1
            this.logMethod(method, isLast, 'service')
        }

        console.log()
    }

    /**
     * Log a single method
     */
    private logMethod(
        method: any,
        isLast: boolean,
        type: 'controller' | 'service'
    ): void {
        const prefix = isLast ? '└── ' : '├── '

        // Build method signature
        let methodSignature = method.name
        if (type === 'controller') {
            // For controllers, show HTTP method and path
            const httpMethod = this.getHttpMethod(method.decorators)
            const path = this.getPath(method.decorators)
            if (httpMethod && path) {
                methodSignature = `${httpMethod} ${path}`
            }
        } else {
            // For services, show method signature with parameters
            const params = method.parameters
                .map((p: any) => `${p.name}: ${p.type}`)
                .join(', ')
            methodSignature = `${method.name}(${params})`
        }

        const methodLine = this.options.colorOutput
            ? chalk.white(`${prefix}${methodSignature}`)
            : `${prefix}${methodSignature}`

        console.log(methodLine)

        // Log parameters
        if (method.parameters.length > 0) {
            const paramPrefix = isLast ? '    ' : '│   '
            const params = method.parameters
                .map((p: any) => {
                    let paramStr = p.name
                    if (p.decorator) {
                        paramStr = `${p.name} (${p.decorator})`
                    }
                    return `${paramStr}: ${p.type}`
                })
                .join(', ')

            const paramLine = this.options.colorOutput
                ? chalk.gray(`${paramPrefix}├── Parameters: [${params}]`)
                : `${paramPrefix}├── Parameters: [${params}]`

            console.log(paramLine)
        }

        // Log return type
        const returnPrefix = isLast ? '    ' : '│   '
        const returnLine = this.options.colorOutput
            ? chalk.gray(`${returnPrefix}└── Return Type: ${method.returnType}`)
            : `${returnPrefix}└── Return Type: ${method.returnType}`

        console.log(returnLine)

        // Log decorators for controllers
        if (type === 'controller' && method.decorators.length > 0) {
            const decoratorPrefix = isLast ? '    ' : '│   '
            const decorators = method.decorators
                .map((d: string) => `@${d}()`)
                .join(', ')
            const decoratorLine = this.options.colorOutput
                ? chalk.gray(`${decoratorPrefix}└── Decorators: ${decorators}`)
                : `${decoratorPrefix}└── Decorators: ${decorators}`

            console.log(decoratorLine)
        }
    }

    /**
     * Extract HTTP method from decorators
     */
    private getHttpMethod(decorators: string[]): string | null {
        const httpMethods = [
            'Get',
            'Post',
            'Put',
            'Delete',
            'Patch',
            'Options',
            'Head',
        ]

        for (const decorator of decorators) {
            if (httpMethods.includes(decorator)) {
                return decorator.toUpperCase()
            }
        }

        return null
    }

    /**
     * Extract path from decorators
     */
    private getPath(decorators: string[]): string | null {
        // This is a simplified version - in a real implementation,
        // you'd need to parse the decorator arguments
        const httpMethods = [
            'Get',
            'Post',
            'Put',
            'Delete',
            'Patch',
            'Options',
            'Head',
        ]

        for (const decorator of decorators) {
            if (httpMethods.includes(decorator)) {
                // For now, just return the decorator name
                // In a real implementation, you'd extract the path argument
                return `/${decorator.toLowerCase()}`
            }
        }

        return null
    }

    /**
     * Log final summary
     */
    logFinalSummary(
        controllers: ControllerInfo[],
        services: ServiceInfo[],
        analysisTime: number
    ): void {
        const totalControllerMethods = controllers.reduce(
            (sum, c) => sum + c.methods.length,
            0
        )
        const totalServiceMethods = services.reduce(
            (sum, s) => sum + s.methods.length,
            0
        )

        console.log()
        if (this.options.colorOutput) {
            console.log(chalk.blue.bold('📊 Summary:'))
            console.log(
                chalk.white(`   • Total Controllers: ${controllers.length}`)
            )
            console.log(chalk.white(`   • Total Services: ${services.length}`))
            console.log(
                chalk.white(
                    `   • Total Controller Methods: ${totalControllerMethods}`
                )
            )
            console.log(
                chalk.white(
                    `   • Total Service Methods: ${totalServiceMethods}`
                )
            )
            console.log(
                chalk.green(
                    `   • Analysis completed in ${analysisTime.toFixed(2)}s`
                )
            )
        } else {
            console.log('📊 Summary:')
            console.log(`   • Total Controllers: ${controllers.length}`)
            console.log(`   • Total Services: ${services.length}`)
            console.log(
                `   • Total Controller Methods: ${totalControllerMethods}`
            )
            console.log(`   • Total Service Methods: ${totalServiceMethods}`)
            console.log(
                `   • Analysis completed in ${analysisTime.toFixed(2)}s`
            )
        }
    }
}
