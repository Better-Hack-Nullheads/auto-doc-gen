# AutoDocGen - Simple Package Plan

## Overview

A simple npm package that reads NestJS controllers and services, then console.logs their content including functions, types, and responses. This is the minimal viable version focusing on core analysis and logging.

## Simplified Package Structure

```
@auto-doc-gen/
├── src/
│   ├── core/
│   │   ├── analyzer.ts          # Main analysis engine
│   │   └── logger.ts            # Console logging utilities
│   ├── extractors/
│   │   ├── controller-extractor.ts
│   │   └── service-extractor.ts
│   ├── types/
│   │   ├── controller.types.ts
│   │   ├── service.types.ts
│   │   └── common.types.ts
│   └── index.ts                 # Main entry point
├── package.json
├── tsconfig.json
└── README.md
```

## Core Features (Simplified)

### 1. Controller Analysis

-   **Find Controllers**: Scan for files with `@Controller()` decorator
-   **Extract Methods**: Get all public methods in controllers
-   **Route Information**: Extract HTTP methods (@Get, @Post, etc.) and paths
-   **Parameters**: Get method parameters and their types
-   **Return Types**: Extract return types of methods

### 2. Service Analysis

-   **Find Services**: Scan for files with `@Injectable()` decorator
-   **Extract Methods**: Get all public methods in services
-   **Dependencies**: Extract constructor dependencies
-   **Method Signatures**: Get method parameters and return types

### 3. Console Logging

-   **Structured Output**: Clean, readable console output
-   **Color Coding**: Use colors for different types of information
-   **Summary**: Show total counts of controllers, services, methods

## API Design (Simplified)

### Main Class

```typescript
class AutoDocGen {
    constructor(options?: SimpleOptions)
    analyze(projectPath: string): Promise<void>
    logControllers(controllers: ControllerInfo[]): void
    logServices(services: ServiceInfo[]): void
}
```

### Configuration Options

```typescript
interface SimpleOptions {
    verbose?: boolean // Show detailed information
    includePrivate?: boolean // Include private methods
    colorOutput?: boolean // Use colored console output
}
```

### Type Definitions

```typescript
interface ControllerInfo {
    name: string
    filePath: string
    basePath?: string
    methods: MethodInfo[]
}

interface ServiceInfo {
    name: string
    filePath: string
    dependencies: string[]
    methods: MethodInfo[]
}

interface MethodInfo {
    name: string
    parameters: ParameterInfo[]
    returnType: string
    decorators: string[]
    isPublic: boolean
}

interface ParameterInfo {
    name: string
    type: string
    decorator?: string
    optional: boolean
}
```

## Usage Patterns

### 1. CLI Usage

```bash
# Basic usage
npx @auto-doc-gen analyze ./src

# With options
npx @auto-doc-gen analyze ./src --verbose --no-color
```

### 2. Programmatic Usage

```typescript
import { AutoDocGen } from '@auto-doc-gen'

const docGen = new AutoDocGen({ verbose: true })
await docGen.analyze('./src')
```

## Console Output Example

```
🔍 AutoDocGen Analysis Results
================================

📁 Controllers Found: 2
📁 Services Found: 3

🎯 UserController (/src/users/user.controller.ts)
   Base Path: /users

   Methods:
   ├── GET /users
   │   ├── Parameters: []
   │   ├── Return Type: Promise<User[]>
   │   └── Decorators: @Get()

   ├── POST /users
   │   ├── Parameters: [body: CreateUserDto]
   │   ├── Return Type: Promise<User>
   │   └── Decorators: @Post(), @Body()

   └── GET /users/:id
       ├── Parameters: [id: string]
       ├── Return Type: Promise<User>
       └── Decorators: @Get(':id'), @Param('id')

🎯 AuthController (/src/auth/auth.controller.ts)
   Base Path: /auth

   Methods:
   ├── POST /auth/login
   │   ├── Parameters: [body: LoginDto]
   │   ├── Return Type: Promise<AuthResponse>
   │   └── Decorators: @Post('login'), @Body()

🔧 UserService (/src/users/user.service.ts)
   Dependencies: [UserRepository, ConfigService]

   Methods:
   ├── findAll()
   │   ├── Parameters: []
   │   └── Return Type: Promise<User[]>

   ├── create(userData: CreateUserDto)
   │   ├── Parameters: [userData: CreateUserDto]
   │   └── Return Type: Promise<User>

   └── findById(id: string)
       ├── Parameters: [id: string]
       └── Return Type: Promise<User | null>

🔧 AuthService (/src/auth/auth.service.ts)
   Dependencies: [UserService, JwtService]

   Methods:
   ├── validateUser(email: string, password: string)
   │   ├── Parameters: [email: string, password: string]
   │   └── Return Type: Promise<User | null>

   └── login(user: User)
       ├── Parameters: [user: User]
       └── Return Type: Promise<AuthResponse>

📊 Summary:
   • Total Controllers: 2
   • Total Services: 3
   • Total Controller Methods: 4
   • Total Service Methods: 5
   • Analysis completed in 0.5s
```

## Technical Implementation

### Dependencies (Minimal)

```json
{
    "dependencies": {
        "ts-morph": "^21.0.1",
        "chalk": "^4.1.2"
    },
    "devDependencies": {
        "@types/node": "^20.0.0",
        "typescript": "^5.0.0"
    }
}
```

### Key Technologies

-   **TypeScript**: Primary language
-   **ts-morph**: TypeScript AST manipulation for parsing
-   **chalk**: Colored console output
-   **Node.js fs**: File system operations

### Core Logic Flow

1. **File Discovery**: Find all `.ts` files in the project
2. **AST Parsing**: Parse TypeScript files using ts-morph
3. **Decorator Detection**: Look for `@Controller()` and `@Injectable()`
4. **Method Extraction**: Extract public methods and their signatures
5. **Console Logging**: Format and display the information

## Development Phases (Simplified)

### Phase 1: Basic File Discovery

-   [ ] Find all TypeScript files in project
-   [ ] Basic file filtering (exclude node_modules, dist, etc.)

### Phase 2: AST Parsing

-   [ ] Parse TypeScript files with ts-morph
-   [ ] Detect classes with decorators
-   [ ] Extract basic class information

### Phase 3: Method Analysis

-   [ ] Extract method signatures
-   [ ] Get parameter types and decorators
-   [ ] Extract return types

### Phase 4: Console Output

-   [ ] Format structured output
-   [ ] Add color coding
-   [ ] Create summary statistics

## Package Configuration

### package.json (Simplified)

```json
{
    "name": "@auto-doc-gen",
    "version": "1.0.0",
    "description": "Simple NestJS controller and service analyzer",
    "main": "dist/index.js",
    "types": "dist/index.d.ts",
    "bin": {
        "auto-doc-gen": "dist/cli.js"
    },
    "scripts": {
        "build": "tsc",
        "dev": "tsc --watch",
        "start": "node dist/cli.js"
    },
    "keywords": ["nestjs", "analyzer", "console", "simple"],
    "dependencies": {
        "ts-morph": "^21.0.1",
        "chalk": "^4.1.2"
    },
    "devDependencies": {
        "@types/node": "^20.0.0",
        "typescript": "^5.0.0"
    }
}
```

## File Structure Details

### src/core/analyzer.ts

```typescript
export class AutoDocGen {
    private options: SimpleOptions

    constructor(options: SimpleOptions = {}) {
        this.options = {
            verbose: false,
            includePrivate: false,
            colorOutput: true,
            ...options,
        }
    }

    async analyze(projectPath: string): Promise<void> {
        // Main analysis logic
    }

    private findControllers(files: string[]): Promise<ControllerInfo[]>
    private findServices(files: string[]): Promise<ServiceInfo[]>
    private logResults(
        controllers: ControllerInfo[],
        services: ServiceInfo[]
    ): void
}
```

### src/extractors/controller-extractor.ts

```typescript
export class ControllerExtractor {
    extractControllerInfo(sourceFile: SourceFile): ControllerInfo | null
    private extractMethods(classDeclaration: ClassDeclaration): MethodInfo[]
    private extractDecorators(method: MethodDeclaration): string[]
    private getBasePath(decorators: string[]): string | undefined
}
```

### src/extractors/service-extractor.ts

```typescript
export class ServiceExtractor {
    extractServiceInfo(sourceFile: SourceFile): ServiceInfo | null
    private extractDependencies(constructor: ConstructorDeclaration): string[]
    private extractMethods(classDeclaration: ClassDeclaration): MethodInfo[]
}
```

## Success Criteria

### Basic Functionality

-   ✅ Find all controllers in a NestJS project
-   ✅ Find all services in a NestJS project
-   ✅ Extract method signatures and types
-   ✅ Display clean, readable console output
-   ✅ Show summary statistics

### Performance

-   **Analysis Speed**: < 2 seconds for typical NestJS app
-   **Memory Usage**: < 50MB
-   **File Support**: Handle projects with 100+ files

### User Experience

-   **Setup Time**: < 1 minute from install to first run
-   **Output Clarity**: Easy to read and understand
-   **Error Handling**: Graceful handling of parsing errors

---

This simplified plan focuses on the core functionality: reading NestJS controllers and services, then console.logging their content in a clean, structured format. It's designed to be minimal, fast, and easy to understand while providing valuable insights into the codebase structure.
