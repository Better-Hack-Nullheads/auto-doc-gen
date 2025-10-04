import { ControllerInfo } from '../types/controller.types'
import { ExtractedType } from '../types/json-output.types'
import { ServiceInfo } from '../types/service.types'

export class FileOrganizer {
    static organizeByFile(
        controllers: ControllerInfo[],
        services: ServiceInfo[],
        types: ExtractedType[]
    ): any {
        const fileMap = new Map<string, any>()

        // Group controllers by file
        controllers.forEach((controller) => {
            const filePath = controller.filePath
            if (!fileMap.has(filePath)) {
                fileMap.set(filePath, {
                    filePath,
                    controllers: [],
                    services: [],
                    types: [],
                })
            }
            fileMap.get(filePath).controllers.push(controller)
        })

        // Group services by file
        services.forEach((service) => {
            const filePath = service.filePath
            if (!fileMap.has(filePath)) {
                fileMap.set(filePath, {
                    filePath,
                    controllers: [],
                    services: [],
                    types: [],
                })
            }
            fileMap.get(filePath).services.push(service)
        })

        // Group types by file
        types.forEach((type) => {
            const filePath = type.filePath
            if (!fileMap.has(filePath)) {
                fileMap.set(filePath, {
                    filePath,
                    controllers: [],
                    services: [],
                    types: [],
                })
            }
            fileMap.get(filePath).types.push(type)
        })

        return Array.from(fileMap.values())
    }

    static organizeByType(
        controllers: ControllerInfo[],
        services: ServiceInfo[],
        types: ExtractedType[]
    ): any {
        return {
            controllers,
            services,
            types: {
                interfaces: types.filter((t) => t.type === 'interface'),
                classes: types.filter((t) => t.type === 'class'),
                enums: types.filter((t) => t.type === 'enum'),
                typeAliases: types.filter((t) => t.type === 'type-alias'),
            },
        }
    }

    static organizeByModule(
        controllers: ControllerInfo[],
        services: ServiceInfo[],
        types: ExtractedType[]
    ): any {
        const moduleMap = new Map<string, any>()

        // Extract module name from file path (e.g., /src/products/ -> products)
        const extractModuleName = (filePath: string): string => {
            const parts = filePath.split('/')
            const srcIndex = parts.indexOf('src')
            if (srcIndex !== -1 && parts[srcIndex + 1]) {
                return parts[srcIndex + 1]
            }
            return 'root'
        }

        // Group by module
        const allItems = [
            ...controllers.map((c) => ({ ...c, itemType: 'controller' })),
            ...services.map((s) => ({ ...s, itemType: 'service' })),
            ...types.map((t) => ({ ...t, itemType: 'type' })),
        ]

        allItems.forEach((item) => {
            const moduleName = extractModuleName(item.filePath)
            if (!moduleMap.has(moduleName)) {
                moduleMap.set(moduleName, {
                    moduleName,
                    controllers: [],
                    services: [],
                    types: [],
                })
            }

            const module = moduleMap.get(moduleName)
            if (item.itemType === 'controller') {
                module.controllers.push(item)
            } else if (item.itemType === 'service') {
                module.services.push(item)
            } else if (item.itemType === 'type') {
                module.types.push(item)
            }
        })

        return Array.from(moduleMap.values())
    }
}
