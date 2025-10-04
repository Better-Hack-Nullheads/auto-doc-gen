import {
    Inject,
    Injectable,
    Logger,
    OnApplicationBootstrap,
} from '@nestjs/common'
import { AutoDocGen } from '../core/analyzer'
import { AutoDocGenOptions } from '../types/integration.types'

@Injectable()
export class AutoDocGenService implements OnApplicationBootstrap {
    private readonly logger = new Logger(AutoDocGenService.name)

    constructor(
        @Inject('AUTO_DOC_GEN_OPTIONS')
        private options: AutoDocGenOptions
    ) {}

    async onApplicationBootstrap() {
        if (this.options.autoRun !== false) {
            // Add delay to ensure all modules are loaded
            setTimeout(async () => {
                await this.analyzeProject()
            }, this.options.delay || 1000)
        }
    }

    async analyzeProject(): Promise<void> {
        try {
            this.logger.log('🔍 Starting AutoDocGen analysis...')

            const analyzer = new AutoDocGen({
                verbose: this.options.verbose || false,
                colorOutput: this.options.colorOutput !== false,
                includePrivate: this.options.includePrivate || false,
            })

            const sourcePath = this.options.sourcePath || './src'
            await analyzer.analyze(sourcePath)

            this.logger.log('✅ AutoDocGen analysis completed')
        } catch (error) {
            this.logger.error('❌ AutoDocGen analysis failed:', error)
        }
    }

    async getAnalysisResults() {
        const analyzer = new AutoDocGen({
            verbose: false,
            colorOutput: false,
            includePrivate: this.options.includePrivate || false,
        })

        const sourcePath = this.options.sourcePath || './src'
        return await analyzer.getAnalysisResults(sourcePath)
    }
}
