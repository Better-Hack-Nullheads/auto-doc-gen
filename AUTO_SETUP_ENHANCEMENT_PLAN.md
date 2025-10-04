# AutoDocGen Auto-Setup Enhancement Plan

## Overview

Enhance the auto-doc-gen package to automatically set up scripts and configuration files when installed in a NestJS backend project, making it truly plug-and-play.

## Current State Analysis

### What's Already Working

-   ✅ Basic postinstall script in `package.json` (line 16)
-   ✅ Setup script in `src/setup.ts` that:
    -   Finds package.json in parent directories
    -   Adds docs scripts to package.json
    -   Creates default `autodocgen.config.json`
    -   Provides user feedback

### Current Limitations

-   ❌ Setup only runs on `npm install` (postinstall)
-   ❌ No detection of NestJS project structure
-   ❌ No integration with NestJS module system
-   ❌ No automatic module import in app.module.ts
-   ❌ No environment-specific configuration
-   ❌ No validation of setup success

## Enhancement Plan

### Phase 1: Smart Project Detection & Setup

#### 1.1 Enhanced Project Detection

```typescript
// New functionality to detect:
- NestJS project structure (src/main.ts, app.module.ts)
- TypeScript configuration
- Existing documentation setup
- Package manager (npm/yarn/pnpm)
- Project type (monorepo vs single package)
```

#### 1.2 Intelligent Script Addition

```json
// Enhanced scripts to add:
{
    "docs": "auto-doc-gen export src --config autodocgen.config.json",
    "docs:analyze": "auto-doc-gen analyze src",
    "docs:info": "auto-doc-gen info src",
    "docs:export": "auto-doc-gen export src --config autodocgen.config.json",
    "docs:all": "auto-doc-gen export-all src --config autodocgen.config.json",
    "docs:watch": "auto-doc-gen export src --config autodocgen.config.json --watch",
    "docs:serve": "auto-doc-gen serve --config autodocgen.config.json"
}
```

### Phase 2: Automatic NestJS Integration

#### 2.1 Auto Module Import

```typescript
// Automatically modify app.module.ts to include:
import { AutoDocGenModule } from '@auto-doc-gen/core';

@Module({
  imports: [
    // ... existing imports
    AutoDocGenModule.forRoot({
      sourcePath: './src',
      autoRun: true,
      verbose: false,
      outputPath: './docs'
    })
  ],
  // ... rest of module
})
```

#### 2.2 Environment-Based Configuration

```json
// Create environment-specific configs:
- autodocgen.config.json (base)
- autodocgen.dev.json (development)
- autodocgen.prod.json (production)
```

### Phase 3: Advanced Setup Features

#### 3.1 Interactive Setup Mode

```bash
# New CLI command for interactive setup
npx auto-doc-gen setup --interactive
```

#### 3.2 Setup Validation & Health Check

```typescript
// Validate setup after installation:
- Check if scripts were added correctly
- Verify config file creation
- Test module import
- Validate file permissions
- Check for conflicts with existing tools
```

#### 3.3 Uninstall Cleanup

```json
// Add to package.json:
"scripts": {
  "preuninstall": "auto-doc-gen cleanup"
}
```

### Phase 4: Enhanced Configuration Management

#### 4.1 Smart Default Configuration

```json
// Context-aware default config based on:
- Project structure analysis
- Existing NestJS patterns
- Common file locations
- TypeScript configuration
```

#### 4.2 Configuration Templates

```typescript
// Multiple config templates:
- basic.json (minimal setup)
- standard.json (recommended defaults)
- advanced.json (full features)
- custom.json (user-defined)
```

## Implementation Strategy

### File Structure Changes

```
auto-doc-gen/
├── src/
│   ├── setup/
│   │   ├── project-detector.ts      # Detect NestJS projects
│   │   ├── script-manager.ts        # Manage package.json scripts
│   │   ├── config-generator.ts      # Generate config files
│   │   ├── module-integrator.ts     # Auto-import modules
│   │   └── setup-validator.ts       # Validate setup
│   ├── templates/
│   │   ├── config-templates/        # Config file templates
│   │   └── module-templates/        # Module import templates
│   └── utils/
│       ├── file-manipulator.ts      # Safe file operations
│       └── project-analyzer.ts      # Analyze project structure
```

### New CLI Commands

```bash
# Enhanced setup commands
auto-doc-gen setup                    # Basic setup (current)
auto-doc-gen setup --interactive     # Interactive setup
auto-doc-gen setup --force           # Force re-setup
auto-doc-gen setup --validate        # Validate existing setup
auto-doc-gen setup --cleanup         # Remove setup artifacts
auto-doc-gen setup --status          # Show setup status
```

### Configuration Enhancements

```json
// Enhanced autodocgen.config.json
{
    "project": {
        "type": "nestjs",
        "version": "11.x",
        "sourcePath": "./src",
        "outputPath": "./docs"
    },
    "integration": {
        "autoImport": true,
        "autoRun": true,
        "watchMode": false,
        "serveMode": false
    },
    "output": {
        "formats": ["json", "markdown"],
        "watch": false,
        "serve": false,
        "port": 3001
    },
    "analysis": {
        "includeTests": false,
        "includePrivate": false,
        "maxDepth": 5
    }
}
```

## User Experience Flow

### Installation Flow

1. **User runs**: `npm install @auto-doc-gen/core`
2. **Postinstall triggers**: Enhanced setup script
3. **Project detection**: Analyzes NestJS structure
4. **Script addition**: Adds docs scripts to package.json
5. **Config creation**: Creates tailored config file
6. **Module integration**: Auto-imports module in app.module.ts
7. **Validation**: Verifies setup success
8. **User feedback**: Shows success message with next steps

### Post-Installation Experience

```bash
🎉 AutoDocGen setup complete!

✅ Added 6 documentation scripts to package.json
✅ Created autodocgen.config.json with NestJS defaults
✅ Integrated AutoDocGenModule in app.module.ts
✅ Setup validated successfully

📋 Available commands:
   npm run docs        - Generate documentation
   npm run docs:watch  - Watch mode for development
   npm run docs:serve  - Serve documentation locally

🔧 Configuration: Edit autodocgen.config.json to customize
📖 Documentation: https://github.com/your-repo/auto-doc-gen

Next steps:
1. Run 'npm run docs' to generate your first documentation
2. Customize autodocgen.config.json as needed
3. Use 'npm run docs:watch' during development
```

## Technical Considerations

### Safety Measures

-   **Backup existing files** before modification
-   **Validate file syntax** before writing
-   **Graceful fallback** if auto-setup fails
-   **Non-destructive operations** (don't overwrite existing configs)
-   **Permission checks** before file operations

### Error Handling

-   **Detailed error messages** with solutions
-   **Rollback capability** if setup fails
-   **Manual setup instructions** as fallback
-   **Logging** for debugging setup issues

### Compatibility

-   **NestJS versions**: 8.x, 9.x, 10.x, 11.x
-   **Package managers**: npm, yarn, pnpm
-   **Operating systems**: Windows, macOS, Linux
-   **Node.js versions**: 16.x, 18.x, 20.x

## Success Metrics

### Setup Success Rate

-   Target: 95% successful auto-setup
-   Measure: Successful script addition + config creation + module import

### User Adoption

-   Target: 80% of users use auto-added scripts
-   Measure: Usage of npm run docs commands

### Error Reduction

-   Target: <5% setup-related issues
-   Measure: GitHub issues related to setup problems

## Implementation Timeline

### Week 1: Core Enhancements

-   Enhanced project detection
-   Improved script management
-   Better configuration generation

### Week 2: NestJS Integration

-   Auto module import
-   Environment-specific configs
-   Setup validation

### Week 3: Advanced Features

-   Interactive setup mode
-   Health checks
-   Cleanup functionality

### Week 4: Testing & Polish

-   Comprehensive testing
-   Error handling improvements
-   Documentation updates

## Risk Mitigation

### Technical Risks

-   **File corruption**: Implement backup and validation
-   **Permission issues**: Add proper error handling
-   **Version conflicts**: Test with multiple NestJS versions

### User Experience Risks

-   **Setup failures**: Provide clear fallback instructions
-   **Unwanted changes**: Make all operations reversible
-   **Confusion**: Provide clear documentation and examples

## Future Enhancements

### Phase 5: Advanced Integration

-   **VS Code extension** for real-time documentation
-   **GitHub Actions** integration for CI/CD
-   **Web dashboard** for documentation management
-   **API documentation** generation
-   **OpenAPI/Swagger** integration

### Phase 6: Ecosystem Integration

-   **NestJS CLI** integration
-   **Popular frameworks** support (Fastify, Express)
-   **Database schema** documentation
-   **Testing documentation** generation

---

## Approval Required

This plan enhances the auto-doc-gen package to provide a seamless, plug-and-play experience for NestJS developers. The implementation will be done in phases to ensure stability and user satisfaction.

**Key Benefits:**

-   ✅ Zero-configuration setup
-   ✅ Automatic NestJS integration
-   ✅ Intelligent project detection
-   ✅ Comprehensive error handling
-   ✅ Future-proof architecture

**Ready for implementation?** Please review and approve this plan before proceeding with the code changes.
