import { ResolvedType } from '../core/type-resolver'
import {
    JsonSchema,
    PropertySchema,
    ValidationRule,
} from '../types/enhanced-output.types'

export class SchemaGenerator {
    /**
     * Convert ResolvedType to JSON Schema
     */
    generateSchema(resolvedType: ResolvedType): JsonSchema {
        switch (resolvedType.type) {
            case 'primitive':
                return this.generatePrimitiveSchema(resolvedType)
            case 'interface':
            case 'class':
                return this.generateObjectSchema(resolvedType)
            case 'array':
                return this.generateArraySchema(resolvedType)
            case 'union':
                return this.generateUnionSchema(resolvedType)
            case 'enum':
                return this.generateEnumSchema(resolvedType)
            default:
                return {
                    type: 'object',
                    description: `Unknown type: ${resolvedType.name}`,
                }
        }
    }

    /**
     * Generate schema for primitive types
     */
    private generatePrimitiveSchema(resolvedType: ResolvedType): JsonSchema {
        const typeMapping: Record<string, string> = {
            string: 'string',
            number: 'number',
            boolean: 'boolean',
            Date: 'string',
            any: 'object',
            void: 'null',
            null: 'null',
            undefined: 'null',
        }

        const schema: JsonSchema = {
            type: typeMapping[resolvedType.name] || 'string',
            description: resolvedType.description,
        }

        // Add format for Date
        if (resolvedType.name === 'Date') {
            schema.format = 'date-time'
        }

        return schema
    }

    /**
     * Generate schema for object types (interfaces/classes)
     */
    private generateObjectSchema(resolvedType: ResolvedType): JsonSchema {
        const schema: JsonSchema = {
            type: 'object',
            description: resolvedType.description,
            properties: {},
            required: [],
        }

        if (resolvedType.properties) {
            for (const property of resolvedType.properties) {
                const propertySchema = this.generatePropertySchema(property)
                schema.properties![property.name] = propertySchema

                if (!property.optional) {
                    schema.required!.push(property.name)
                }
            }
        }

        return schema
    }

    /**
     * Generate schema for array types
     */
    private generateArraySchema(resolvedType: ResolvedType): JsonSchema {
        const schema: JsonSchema = {
            type: 'array',
            description: resolvedType.description,
        }

        if (resolvedType.items) {
            schema.items = this.generateSchema(resolvedType.items)
        }

        return schema
    }

    /**
     * Generate schema for union types
     */
    private generateUnionSchema(resolvedType: ResolvedType): JsonSchema {
        if (!resolvedType.unionTypes || resolvedType.unionTypes.length === 0) {
            return { type: 'string', description: resolvedType.description }
        }

        // Handle simple union types (string | number | boolean)
        const primitiveTypes = resolvedType.unionTypes.filter(
            (t) => t.type === 'primitive'
        )
        if (primitiveTypes.length === resolvedType.unionTypes.length) {
            const types = primitiveTypes.map((t) =>
                this.mapPrimitiveType(t.name)
            )
            if (types.length === 1) {
                return { type: types[0], description: resolvedType.description }
            }
            return { type: types[0], description: resolvedType.description }
        }

        // Handle complex union types with oneOf
        const schemas = resolvedType.unionTypes.map((t) =>
            this.generateSchema(t)
        )
        return {
            oneOf: schemas,
            description: resolvedType.description,
        } as any
    }

    /**
     * Generate schema for enum types
     */
    private generateEnumSchema(resolvedType: ResolvedType): JsonSchema {
        const schema: JsonSchema = {
            type: 'string',
            description: resolvedType.description,
        }

        if (resolvedType.properties) {
            const enumValues = resolvedType.properties
                .map((p) => p.defaultValue)
                .filter((v) => v !== undefined)
            if (enumValues.length > 0) {
                schema.enum = enumValues
            }
        }

        return schema
    }

    /**
     * Generate property schema
     */
    private generatePropertySchema(property: any): PropertySchema {
        const baseSchema = this.generateSchema(property.type)

        return {
            ...baseSchema,
            description: property.description,
            optional: property.optional,
            examples: property.defaultValue
                ? [property.defaultValue]
                : undefined,
        }
    }

    /**
     * Map primitive type names to JSON Schema types
     */
    private mapPrimitiveType(typeName: string): string {
        const mapping: Record<string, string> = {
            string: 'string',
            number: 'number',
            boolean: 'boolean',
            Date: 'string',
            any: 'object',
            void: 'null',
            null: 'null',
            undefined: 'null',
        }
        return mapping[typeName] || 'string'
    }

    /**
     * Generate example data from schema
     */
    generateExample(schema: JsonSchema): any {
        if (schema.examples && schema.examples.length > 0) {
            return schema.examples[0]
        }

        switch (schema.type) {
            case 'string':
                if (schema.format === 'date-time') {
                    return new Date().toISOString()
                }
                if (schema.enum && schema.enum.length > 0) {
                    return schema.enum[0]
                }
                return 'string'

            case 'number':
                return 0

            case 'boolean':
                return true

            case 'array':
                if (schema.items) {
                    return [this.generateExample(schema.items)]
                }
                return []

            case 'object':
                if (schema.properties) {
                    const example: any = {}
                    for (const [key, prop] of Object.entries(
                        schema.properties
                    )) {
                        if (!schema.required || schema.required.includes(key)) {
                            example[key] = this.generateExample(
                                prop as JsonSchema
                            )
                        }
                    }
                    return example
                }
                return {}

            default:
                return null
        }
    }

    /**
     * Generate request/response examples
     */
    generateExamples(
        requestSchema?: JsonSchema,
        responseSchema?: JsonSchema
    ): {
        request?: any
        response?: any
    } {
        const examples: { request?: any; response?: any } = {}

        if (requestSchema) {
            examples.request = this.generateExample(requestSchema)
        }

        if (responseSchema) {
            examples.response = this.generateExample(responseSchema)
        }

        return examples
    }

    /**
     * Convert validation rules to JSON Schema constraints
     */
    convertValidationRulesToSchema(
        validationRules: ValidationRule[]
    ): Partial<JsonSchema> {
        const schema: Partial<JsonSchema> = {}

        for (const rule of validationRules) {
            switch (rule.rule) {
                case 'IsString':
                    schema.type = 'string'
                    break
                case 'IsNumber':
                    schema.type = 'number'
                    break
                case 'IsBoolean':
                    schema.type = 'boolean'
                    break
                case 'IsArray':
                    schema.type = 'array'
                    break
                case 'IsEmail':
                    schema.format = 'email'
                    break
                case 'IsUrl':
                    schema.format = 'uri'
                    break
                case 'IsDate':
                    schema.format = 'date-time'
                    break
                case 'MinLength':
                    if (rule.value !== undefined) {
                        ;(schema as any).minLength = rule.value
                    }
                    break
                case 'MaxLength':
                    if (rule.value !== undefined) {
                        ;(schema as any).maxLength = rule.value
                    }
                    break
                case 'Min':
                    if (rule.value !== undefined) {
                        ;(schema as any).minimum = rule.value
                    }
                    break
                case 'Max':
                    if (rule.value !== undefined) {
                        ;(schema as any).maximum = rule.value
                    }
                    break
                case 'IsEnum':
                    if (rule.parameters && rule.parameters.length > 0) {
                        schema.enum = rule.parameters
                    }
                    break
            }
        }

        return schema
    }
}
