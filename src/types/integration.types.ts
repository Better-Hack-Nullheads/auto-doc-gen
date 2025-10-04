export interface AutoDocGenOptions {
    autoRun?: boolean // Run analysis on app startup (default: true)
    verbose?: boolean // Show detailed output (default: false)
    colorOutput?: boolean // Use colored console output (default: true)
    includePrivate?: boolean // Include private methods (default: false)
    sourcePath?: string // Path to analyze (default: './src')
    outputFormat?: 'console' | 'file' | 'both' // Output format (default: 'console')
    outputFile?: string // File path for output (default: 'auto-doc-analysis.md')
    delay?: number // Delay before analysis in ms (default: 1000)
}
