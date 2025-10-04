# Getting Started

## Install

```bash
npm install @auto-doc-gen/core
```

## Use

```bash
# Analyze your NestJS project
npx @auto-doc-gen/core analyze ./src
```

## What You'll See

```
🔍 AutoDocGen Analysis Results
===============================

📁 Controllers Found: 2
📁 Services Found: 1

🎯 UserController (C:/project/src/users/user.controller.ts)
   Base Path: /users

   Methods:
   ├── GET /users
   │   └── Return Type: Promise<User[]>

   ├── POST /users
   │   ├── Parameters: [body: CreateUserDto]
   │   └── Return Type: Promise<User>

🔧 UserService (C:/project/src/users/user.service.ts)
   Dependencies: [UserRepository]

   Methods:
   ├── findAll()
   │   └── Return Type: Promise<User[]>
```

## Options

```bash
# Quick summary
auto-doc-gen info ./src

# Verbose output
auto-doc-gen analyze ./src --verbose

# No colors (for CI/CD)
auto-doc-gen analyze ./src --no-color
```

That's it!
