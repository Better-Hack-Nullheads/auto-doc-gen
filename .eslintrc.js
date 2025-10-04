module.exports = {
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
    },
    plugins: ['@typescript-eslint'],
    extends: ['eslint:recommended'],
    rules: {
        // Keep it simple - minimal rules
        'no-unused-vars': 'off', // Turn off base rule
        '@typescript-eslint/no-unused-vars': [
            'error',
            { argsIgnorePattern: '^_' },
        ],
        'prefer-const': 'error',
        'no-var': 'error',
        'no-console': 'off', // Allow console.log for CLI tool
    },
    env: {
        node: true,
        es6: true,
    },
    ignorePatterns: ['dist/', 'node_modules/', '*.js'],
}
