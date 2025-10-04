# AutoDocGen

A simple npm package that reads NestJS controllers and services, then console.logs their content including functions, types, and responses.

## Features

-   🔍 **Controller Analysis**: Find and analyze all controllers with `@Controller()` decorator
-   🔧 **Service Analysis**: Find and analyze all services with `@Injectable()` decorator
-   📊 **Method Extraction**: Extract method signatures, parameters, return types, and decorators
-   🎨 **Colored Output**: Beautiful, structured console output with colors
-   ⚡ **Fast Analysis**: Quick analysis of NestJS projects

## Installation

```bash
npm install @auto-doc-gen/core
```

## Usage

### CLI Usage

```bash
# Basic analysis
npx @auto-doc-gen/core analyze ./src

# With options
npx @auto-doc-gen/core analyze ./src --verbose --no-color

# Quick info
npx @auto-doc-gen/core info ./src
```

### Programmatic Usage

```typescript
import { AutoDocGen } from '@auto-doc-gen/core'

const analyzer = new AutoDocGen({ verbose: true })
await analyzer.analyze('./src')
```

## Example Output

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
   │   └── Return Type: Promise<User[]>

   ├── POST /users
   │   ├── Parameters: [body: CreateUserDto]
   │   └── Return Type: Promise<User>

📊 Summary:
   • Total Controllers: 2
   • Total Services: 3
   • Analysis completed in 0.5s
```

## Options

-   `--verbose`: Show detailed information during analysis
-   `--no-color`: Disable colored output
-   `--include-private`: Include private methods in analysis

## License

MIT
