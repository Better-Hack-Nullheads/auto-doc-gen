import { anthropic } from '@ai-sdk/anthropic'
import { AIProvider } from '../../types/ai.types'

export class AnthropicProvider implements AIProvider {
    name = 'anthropic'
    models = ['claude-3-5-sonnet', 'claude-3-haiku', 'claude-3-opus']

    createModel(modelName: string, apiKey: string): any {
        // Set API key as environment variable for the SDK
        process.env.ANTHROPIC_API_KEY = apiKey
        return anthropic(modelName)
    }

    getProviderOptions() {
        return {
            anthropic: {
                structuredOutputs: true,
            },
        }
    }
}
