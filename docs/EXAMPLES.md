# Examples

## Basic Usage

```bash
# Analyze a NestJS project
auto-doc-gen analyze ./src
```

**Output:**

```
🔍 AutoDocGen Analysis Results
===============================

📁 Controllers Found: 2
📁 Services Found: 2

🎯 UserController (C:/project/src/users/user.controller.ts)
   Base Path: /users

   Methods:
   ├── GET /users
   │   ├── Parameters: []
   │   └── Return Type: Promise<User[]>

   ├── POST /users
   │   ├── Parameters: [body: CreateUserDto]
   │   └── Return Type: Promise<User>

🔧 UserService (C:/project/src/users/user.service.ts)
   Dependencies: [UserRepository, ConfigService]

   Methods:
   ├── findAll()
   │   └── Return Type: Promise<User[]>

   ├── create(userData: CreateUserDto)
   │   ├── Parameters: [userData: CreateUserDto]
   │   └── Return Type: Promise<User>
```

## Programmatic Usage

```typescript
import { AutoDocGen } from '@auto-doc-gen/core'

// Get analysis results
const analyzer = new AutoDocGen()
const results = await analyzer.getAnalysisResults('./src')

// Process results
results.controllers.forEach((controller) => {
    console.log(`Controller: ${controller.name}`)
    controller.methods.forEach((method) => {
        console.log(`  Method: ${method.name}`)
    })
})
```

## CI/CD Integration

```yaml
# GitHub Actions
- name: Analyze project
  run: auto-doc-gen analyze ./src --no-color
```

```json
// package.json
{
    "scripts": {
        "analyze": "auto-doc-gen analyze ./src",
        "build:analyze": "npm run build && npm run analyze"
    }
}
```

That's it - simple and useful!
