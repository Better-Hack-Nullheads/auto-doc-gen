import { google } from '@ai-sdk/google'
import { AIProvider } from '../../types/ai.types'

export class GoogleProvider implements AIProvider {
    name = 'google'
    models = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-1.5-flash']

    createModel(modelName: string, apiKey: string) {
        // Set API key as environment variable for the SDK
        process.env.GOOGLE_GENERATIVE_AI_API_KEY = apiKey
        return google(modelName)
    }

    getProviderOptions() {
        return {
            google: {
                structuredOutputs: true,
            },
        }
    }
}
