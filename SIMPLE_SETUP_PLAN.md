# AutoDocGen Simple Auto-Setup Plan

## Overview

Keep it simple: automatically create a config file and add scripts when the package is installed.

## Current State Analysis

### What's Already Working

-   ✅ Basic postinstall script in `package.json` (line 16)
-   ✅ Setup script in `src/setup.ts` that:
    -   Finds package.json in parent directories
    -   Adds docs scripts to package.json
    -   Creates default `autodocgen.config.json`
    -   Provides user feedback

### What Needs Improvement

-   ❌ Config file could be better tailored for NestJS
-   ❌ Scripts could be more useful
-   ❌ Better error handling needed

## Simple Enhancement Plan

### Goal: Just Make It Work Better

1. **Create a better config file** - Tailored for NestJS projects
2. **Add useful scripts** - Common documentation tasks
3. **Keep it simple** - No complex integrations, just the basics

### Enhanced Scripts to Add

```json
{
    "docs": "auto-doc-gen export src --config autodocgen.config.json",
    "docs:analyze": "auto-doc-gen analyze src",
    "docs:info": "auto-doc-gen info src",
    "docs:export": "auto-doc-gen export src --config autodocgen.config.json",
    "docs:all": "auto-doc-gen export-all src --config autodocgen.config.json"
}
```

### Better Config File

```json
{
    "sourcePath": "./src",
    "output": {
        "json": {
            "enabled": true,
            "pretty": true,
            "compact": true,
            "outputDir": "./docs",
            "filename": "api-documentation.json",
            "includeMetadata": true,
            "timestamp": true
        },
        "console": {
            "enabled": true,
            "verbose": false,
            "colorOutput": true
        }
    },
    "analysis": {
        "includeInterfaces": true,
        "includeClasses": true,
        "includeEnums": true,
        "includeValidationRules": true,
        "includeDecorators": true,
        "includeImports": true,
        "maxDepth": 5
    },
    "include": [
        "**/*.controller.ts",
        "**/*.service.ts",
        "**/*.dto.ts",
        "**/*.interface.ts",
        "**/*.enum.ts"
    ],
    "exclude": [
        "**/*.spec.ts",
        "**/*.test.ts",
        "**/node_modules/**",
        "**/dist/**"
    ]
}
```

## Implementation Changes

### 1. Update `src/setup.ts`

-   Improve the default config object
-   Better error handling
-   Cleaner user feedback

### 2. Keep Everything Else Simple

-   No complex project detection
-   No automatic module imports
-   No environment-specific configs
-   Just focus on config file + scripts

## User Experience

### Installation Flow

1. User runs: `npm install @auto-doc-gen/core`
2. Postinstall runs setup script
3. Scripts added to package.json
4. Config file created
5. Success message shown

### Post-Installation

```bash
🎉 AutoDocGen setup complete!

✅ Added 5 docs scripts to package.json
✅ Created autodocgen.config.json

📋 Available commands:
   npm run docs        - Generate documentation
   npm run docs:analyze - Show analysis in console
   npm run docs:info   - Quick summary
   npm run docs:export - Export to JSON file
   npm run docs:all    - Export multiple formats

🔧 Configuration: Edit autodocgen.config.json to customize
```

## Implementation Steps

### Step 1: Update Setup Script

-   Improve config file generation
-   Better error handling
-   Cleaner output messages

### Step 2: Test the Setup

-   Test with fresh NestJS project
-   Verify scripts work
-   Verify config file is created correctly

### Step 3: Documentation

-   Update README with new setup info
-   Add examples of usage

## Success Criteria

-   ✅ Scripts are added to package.json
-   ✅ Config file is created with good defaults
-   ✅ User gets clear feedback
-   ✅ Everything works out of the box

## That's It!

Keep it simple, focused, and working. No over-engineering, just make the basic setup better.

---

**Ready to implement?** This is a much simpler approach that focuses on the essentials.
