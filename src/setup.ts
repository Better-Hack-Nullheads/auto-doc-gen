import * as fs from 'fs'
import * as path from 'path'

/**
 * Auto-setup script that runs after package installation
 * Automatically adds docs scripts to the user's package.json
 */
function setupAutoDocGen() {
    try {
        console.log('🔧 Setting up AutoDocGen...')

        // Find package.json in parent directories
        // When running from node_modules, we need to go up to find the actual project
        let currentDir = process.cwd()
        let packageJsonPath: string | null = null

        // Look for package.json in current and parent directories
        // Skip node_modules directories to find the actual project root
        while (currentDir !== path.dirname(currentDir)) {
            const potentialPath = path.join(currentDir, 'package.json')
            if (fs.existsSync(potentialPath)) {
                // Check if this is the actual project (not in node_modules)
                const isInNodeModules = currentDir.includes('node_modules')
                if (!isInNodeModules) {
                    packageJsonPath = potentialPath
                    break
                }
            }
            currentDir = path.dirname(currentDir)
        }

        if (!packageJsonPath) {
            console.log(
                '⚠️  No package.json found. AutoDocGen will work via CLI commands.'
            )
            return
        }

        // Read package.json
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))

        // Add docs scripts if they don't exist
        if (!packageJson.scripts) {
            packageJson.scripts = {}
        }

        const scriptsToAdd = {
            docs: 'auto-doc-gen export src --config autodocgen.config.json',
            'docs:analyze': 'auto-doc-gen analyze src',
            'docs:info': 'auto-doc-gen info src',
            'docs:export':
                'auto-doc-gen export src --config autodocgen.config.json',
            'docs:all':
                'auto-doc-gen export-all src --config autodocgen.config.json',
        }

        let addedScripts = 0
        for (const [scriptName, scriptCommand] of Object.entries(
            scriptsToAdd
        )) {
            if (!packageJson.scripts[scriptName]) {
                packageJson.scripts[scriptName] = scriptCommand
                addedScripts++
            }
        }

        if (addedScripts > 0) {
            try {
                // Write updated package.json
                fs.writeFileSync(
                    packageJsonPath,
                    JSON.stringify(packageJson, null, 2) + '\n'
                )
                console.log(
                    `✅ Added ${addedScripts} docs scripts to package.json`
                )
            } catch (error) {
                console.log(
                    '⚠️  Could not update package.json. You can add scripts manually.'
                )
                console.log('   Scripts to add:')
                for (const [scriptName, scriptCommand] of Object.entries(
                    scriptsToAdd
                )) {
                    console.log(`   "${scriptName}": "${scriptCommand}"`)
                }
            }
        } else {
            console.log('✅ AutoDocGen scripts already exist in package.json')
        }

        // Create configuration file if it doesn't exist
        const configPath = path.join(
            path.dirname(packageJsonPath),
            'autodocgen.config.json'
        )
        if (!fs.existsSync(configPath)) {
            // Generate database name from project name
            const projectName = packageJson.name || 'api_docs'
            const cleanProjectName = projectName
                .replace(/[^a-zA-Z0-9]/g, '_')
                .toLowerCase()
            const databaseName = `${cleanProjectName}_docs`

            const defaultConfig = {
                sourcePath: './src',
                output: {
                    json: {
                        enabled: true,
                        pretty: true,
                        compact: true,
                        outputDir: './docs',
                        filename: 'api-documentation.json',
                        includeMetadata: true,
                        timestamp: true,
                    },
                    console: {
                        enabled: true,
                        verbose: false,
                        colorOutput: true,
                    },
                },
                database: {
                    type: 'mongodb',
                    connectionString: `mongodb://localhost:27017/${databaseName}`,
                    database: databaseName,
                    mapping: {
                        enabled: true,
                        createCollections: true,
                        includeTypeSchemas: true,
                        includeValidationRules: true,
                    },
                    collections: {
                        documentation: 'documentation',
                        endpoints: 'endpoints',
                        types: 'type_schemas',
                    },
                },
                analysis: {
                    includeInterfaces: true,
                    includeClasses: true,
                    includeEnums: true,
                    includeValidationRules: true,
                    includeDecorators: true,
                    includeImports: true,
                    maxDepth: 5,
                },
                include: [
                    '**/*.controller.ts',
                    '**/*.service.ts',
                    '**/*.dto.ts',
                    '**/*.interface.ts',
                    '**/*.enum.ts',
                ],
                exclude: [
                    '**/*.spec.ts',
                    '**/*.test.ts',
                    '**/node_modules/**',
                    '**/dist/**',
                ],
            }

            try {
                fs.writeFileSync(
                    configPath,
                    JSON.stringify(defaultConfig, null, 2) + '\n'
                )
                console.log(
                    `✅ Created autodocgen.config.json with database config (${databaseName})`
                )
            } catch (error) {
                console.log(
                    '⚠️  Could not create config file. You can create it manually.'
                )
            }
        } else {
            console.log(
                '✅ Configuration file already exists: autodocgen.config.json'
            )
        }

        console.log('\n🎉 AutoDocGen setup complete!')
        console.log('\n📋 Available commands:')
        console.log('   npm run docs        - Generate documentation')
        console.log('   npm run docs:analyze - Show analysis in console')
        console.log('   npm run docs:info   - Quick summary')
        console.log('   npm run docs:export - Export to JSON file')
        console.log('   npm run docs:all    - Export multiple formats')
        console.log(
            '\n🔧 Configuration: Edit autodocgen.config.json to customize'
        )
        console.log(
            '📖 Next step: Run "npm run docs" to generate your first documentation'
        )
    } catch (error) {
        console.log('⚠️  AutoDocGen setup failed:', (error as Error).message)
        console.log('   You can still use: npx auto-doc-gen --help')
    }
}

// Run setup
setupAutoDocGen()
