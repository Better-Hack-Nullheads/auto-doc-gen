import { JsonAnalysisResult } from '../exporters/json-exporter'

export class PromptTemplates {
    static getDefaultTemplate(): string {
        return `
        Analyze this NestJS project and provide a concise but comprehensive overview.
        
        Project: {{totalControllers}} controllers, {{totalServices}} services, {{totalTypes}} types
        
        Controllers: {{controllers}}
        Services: {{services}}
        Data Models: {{types}}
        
        Provide:
        1. Brief project overview
        2. Key controllers and endpoints
        3. Main services and their purpose
        4. Important data models
        5. Top 3 recommendations
        
        Keep it concise but informative. Focus on the most important aspects.
        `
    }

    static getSecurityFocusedTemplate(): string {
        return `
        Focus on security analysis for this NestJS project:
        {{projectData}}
        
        Provide security recommendations for:
        - Authentication and authorization
        - Input validation
        - Data protection
        - API security best practices
        - Common vulnerabilities and mitigations
        `
    }

    static getPerformanceFocusedTemplate(): string {
        return `
        Analyze performance aspects of this NestJS project:
        {{projectData}}
        
        Focus on:
        - Database query optimization
        - Caching strategies
        - API response optimization
        - Memory usage patterns
        - Scalability considerations
        `
    }

    static getArchitectureFocusedTemplate(): string {
        return `
        Analyze the architecture and design patterns of this NestJS project:
        {{projectData}}
        
        Focus on:
        - Design patterns used
        - Module organization
        - Dependency injection patterns
        - Code organization and structure
        - Architectural best practices
        `
    }

    static buildPrompt(
        template: string,
        analysisData: JsonAnalysisResult
    ): string {
        const metadata = analysisData.metadata
        const controllers = JSON.stringify(analysisData.controllers, null, 2)
        const services = JSON.stringify(analysisData.services, null, 2)
        const types = JSON.stringify(analysisData.types, null, 2)
        const projectData = JSON.stringify(analysisData, null, 2)

        return template
            .replace(/\{\{totalFiles\}\}/g, metadata.totalFiles.toString())
            .replace(
                /\{\{totalControllers\}\}/g,
                metadata.totalControllers.toString()
            )
            .replace(
                /\{\{totalServices\}\}/g,
                metadata.totalServices.toString()
            )
            .replace(/\{\{totalMethods\}\}/g, metadata.totalMethods.toString())
            .replace(/\{\{totalTypes\}\}/g, metadata.totalTypes.toString())
            .replace(/\{\{controllers\}\}/g, controllers)
            .replace(/\{\{services\}\}/g, services)
            .replace(/\{\{types\}\}/g, types)
            .replace(/\{\{projectData\}\}/g, projectData)
    }

    static getTemplate(templateName: string): string {
        switch (templateName) {
            case 'security':
                return this.getSecurityFocusedTemplate()
            case 'performance':
                return this.getPerformanceFocusedTemplate()
            case 'architecture':
                return this.getArchitectureFocusedTemplate()
            case 'default':
            default:
                return this.getDefaultTemplate()
        }
    }
}
