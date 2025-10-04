import { MethodInfo } from './common.types'

export interface ControllerInfo {
    name: string
    filePath: string
    basePath?: string
    methods: MethodInfo[]
}
