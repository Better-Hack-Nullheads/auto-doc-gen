import { JsonAnalysisResult } from '../exporters/json-exporter'

export class PromptTemplates {
    static getDefaultTemplate(): string {
        return `
        Generate comprehensive technical documentation for this NestJS project.
        
        Project: {{totalControllers}} controllers, {{totalServices}} services, {{totalTypes}} types
        
        Controllers: {{controllers}}
        Services: {{services}}
        Data Models: {{types}}
        
        Create structured documentation in **Markdown format** with:
        
        ## 1. Project Overview
        - Architecture summary
        - Technology stack
        - Module structure
        
        ## 2. API Endpoints
        For each controller, list:
        - HTTP Method and Path
        - Parameters (name, type, required)
        - Return Type
        - Description
        
        ## 3. Services
        - Business logic summary
        - Key methods and their purpose
        - Dependencies
        
        ## 4. Data Models
        - Properties and types
        - Validation rules
        - Relationships
        
        ## 5. Recommendations
        - Top 3 improvement suggestions
        
        **Important:** Format the response as proper Markdown with headers, tables, code blocks, and bullet points. Use markdown syntax for better readability.
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
