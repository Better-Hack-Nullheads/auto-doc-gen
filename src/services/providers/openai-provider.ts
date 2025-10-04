import { openai } from '@ai-sdk/openai'
import { AIProvider } from '../../types/ai.types'

export class OpenAIProvider implements AIProvider {
    name = 'openai'
    models = ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo']

    createModel(modelName: string, apiKey: string): any {
        // Set API key as environment variable for the SDK
        process.env.OPENAI_API_KEY = apiKey
        return openai(modelName)
    }

    getProviderOptions() {
        return {
            openai: {
                structuredOutputs: true,
            },
        }
    }
}
