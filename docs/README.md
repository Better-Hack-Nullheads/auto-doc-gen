# AutoDocGen Documentation

Simple NestJS controller and service analyzer.

## What is AutoDocGen?

AutoDocGen reads your NestJS controllers and services and shows you what's inside - methods, parameters, return types, and decorators.

## Quick Start

```bash
# Install
npm install @auto-doc-gen/core

# Analyze your project
npx @auto-doc-gen/core analyze ./src
```

## What You Get

-   **Controllers** - Routes, HTTP methods, parameters
-   **Services** - Dependencies, methods, return types
-   **Console output** - Colored, easy to read

## Commands

```bash
# Full analysis
auto-doc-gen analyze ./src

# Quick summary
auto-doc-gen info ./src

# With options
auto-doc-gen analyze ./src --verbose --no-color
```

## Documentation

-   **[Getting Started](./GETTING_STARTED.md)** - Setup and first use
-   **[User Guide](./USER_GUIDE.md)** - All features
-   **[Examples](./EXAMPLES.md)** - Real examples

That's it. Simple and useful.
