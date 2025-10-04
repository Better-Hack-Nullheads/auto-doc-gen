import { DynamicModule, Module } from '@nestjs/common'
import { AutoDocGenOptions } from '../types/integration.types'
import { AutoDocGenService } from './auto-doc-gen.service'

@Module({})
export class AutoDocGenModule {
    static forRoot(options?: AutoDocGenOptions): DynamicModule {
        return {
            module: AutoDocGenModule,
            providers: [
                {
                    provide: 'AUTO_DOC_GEN_OPTIONS',
                    useValue: options || {},
                },
                AutoDocGenService,
            ],
            exports: [AutoDocGenService],
        }
    }

    static forRootAsync(options: {
        useFactory: (
            ...args: any[]
        ) => Promise<AutoDocGenOptions> | AutoDocGenOptions
        inject?: any[]
    }): DynamicModule {
        return {
            module: AutoDocGenModule,
            providers: [
                {
                    provide: 'AUTO_DOC_GEN_OPTIONS',
                    useFactory: options.useFactory,
                    inject: options.inject || [],
                },
                AutoDocGenService,
            ],
            exports: [AutoDocGenService],
        }
    }
}
