import * as fs from 'fs'
import * as path from 'path'

export class FileUtils {
    /**
     * Recursively find all TypeScript files in a directory
     */
    static async findTypeScriptFiles(dir: string): Promise<string[]> {
        const files: string[] = []

        try {
            const entries = await fs.promises.readdir(dir, {
                withFileTypes: true,
            })

            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name)

                if (entry.isDirectory()) {
                    // Skip common directories that shouldn't be analyzed
                    if (this.shouldSkipDirectory(entry.name)) {
                        continue
                    }

                    const subFiles = await this.findTypeScriptFiles(fullPath)
                    files.push(...subFiles)
                } else if (
                    entry.isFile() &&
                    entry.name.endsWith('.ts') &&
                    !entry.name.endsWith('.d.ts')
                ) {
                    files.push(fullPath)
                }
            }
        } catch (error) {
            console.warn(`Warning: Could not read directory ${dir}:`, error)
        }

        return files
    }

    /**
     * Check if a directory should be skipped during analysis
     */
    private static shouldSkipDirectory(dirName: string): boolean {
        const skipDirs = [
            'node_modules',
            'dist',
            'build',
            '.git',
            'coverage',
            '.nyc_output',
            'tmp',
            'temp',
            '.temp',
            '.tmp',
        ]

        return skipDirs.includes(dirName) || dirName.startsWith('.')
    }

    /**
     * Read file content as string
     */
    static async readFileContent(filePath: string): Promise<string> {
        try {
            return await fs.promises.readFile(filePath, 'utf-8')
        } catch (error) {
            throw new Error(`Could not read file ${filePath}: ${error}`)
        }
    }

    /**
     * Check if a file exists
     */
    static async fileExists(filePath: string): Promise<boolean> {
        try {
            await fs.promises.access(filePath)
            return true
        } catch {
            return false
        }
    }
}
