import { MethodInfo } from './common.types'

export interface ServiceInfo {
    name: string
    filePath: string
    dependencies: string[]
    methods: MethodInfo[]
}
