# AutoDocGen Environment Variables

AutoDocGen supports environment variables to override configuration settings. This is useful for:

-   **Security**: Keep sensitive data like database URLs out of config files
-   **Deployment**: Different settings for development, staging, and production
-   **CI/CD**: Easy configuration in automated environments
-   **Docker**: Standard way to configure containers

## Configuration Priority

AutoDocGen uses the following priority order (highest to lowest):

1. **CLI Options** - Command-line arguments
2. **Environment Variables** - System environment variables
3. **Config File** - `autodocgen.config.json`
4. **Defaults** - Built-in default values

## Available Environment Variables

### Database Configuration

| Environment Variable | Description             | Default                              | Example                               |
| -------------------- | ----------------------- | ------------------------------------ | ------------------------------------- |
| `AUTODOCGEN_DB_TYPE` | Database type           | `mongodb`                            | `mongodb`                             |
| `AUTODOCGEN_DB_URL`  | Database connection URL | `mongodb://localhost:27017/api_docs` | `mongodb://user:pass@host:27017/mydb` |
| `AUTODOCGEN_DB_NAME` | Database name           | `api_docs`                           | `my_project_docs`                     |

### JSON Export Configuration

| Environment Variable    | Description                     | Default         | Example                 |
| ----------------------- | ------------------------------- | --------------- | ----------------------- |
| `AUTODOCGEN_OUTPUT_DIR` | Output directory for JSON files | `./docs`        | `/app/output`           |
| `AUTODOCGEN_FILENAME`   | Default filename for exports    | `analysis.json` | `my_analysis.json`      |
| `AUTODOCGEN_FORMAT`     | Output format                   | `json-pretty`   | `json` or `json-pretty` |

### Analysis Configuration

| Environment Variable         | Description             | Default | Example           |
| ---------------------------- | ----------------------- | ------- | ----------------- |
| `AUTODOCGEN_INCLUDE_PRIVATE` | Include private methods | `false` | `true` or `false` |
| `AUTODOCGEN_VERBOSE`         | Show verbose output     | `false` | `true` or `false` |
| `AUTODOCGEN_COLOR_OUTPUT`    | Enable colored output   | `true`  | `true` or `false` |

## Usage Examples

### Development Environment

```bash
# Set environment variables
export AUTODOCGEN_DB_URL="mongodb://localhost:27017/dev_docs"
export AUTODOCGEN_OUTPUT_DIR="./dev-docs"
export AUTODOCGEN_VERBOSE="true"

# Run commands - they'll use the environment variables
npx auto-doc-gen analyze src
npx auto-doc-gen export src
npx auto-doc-gen save src
```

### Production Environment

```bash
# Set production environment variables
export AUTODOCGEN_DB_URL="mongodb://prod-user:secure-password@prod-host:27017/prod_docs"
export AUTODOCGEN_OUTPUT_DIR="/var/log/autodocgen"
export AUTODOCGEN_VERBOSE="false"
export AUTODOCGEN_COLOR_OUTPUT="false"

# Run commands
npx auto-doc-gen analyze src
npx auto-doc-gen save src
```

### Docker Environment

```dockerfile
# Dockerfile
FROM node:18
COPY . /app
WORKDIR /app
RUN npm install

# Set environment variables
ENV AUTODOCGEN_DB_URL="mongodb://mongo:27017/docker_docs"
ENV AUTODOCGEN_OUTPUT_DIR="/app/output"
ENV AUTODOCGEN_VERBOSE="true"

CMD ["npx", "auto-doc-gen", "analyze", "src"]
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'
services:
    autodocgen:
        build: .
        environment:
            - AUTODOCGEN_DB_URL=mongodb://mongo:27017/compose_docs
            - AUTODOCGEN_OUTPUT_DIR=/app/output
            - AUTODOCGEN_VERBOSE=true
        volumes:
            - ./output:/app/output
        depends_on:
            - mongo

    mongo:
        image: mongo:latest
        ports:
            - '27017:27017'
```

### CI/CD Pipeline

```yaml
# GitHub Actions example
name: AutoDocGen Analysis
on: [push, pull_request]

jobs:
    analyze:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v3
            - uses: actions/setup-node@v3
              with:
                  node-version: '18'

            - name: Install dependencies
              run: npm install

            - name: Run AutoDocGen Analysis
              env:
                  AUTODOCGEN_DB_URL: ${{ secrets.MONGODB_URL }}
                  AUTODOCGEN_OUTPUT_DIR: ./ci-output
                  AUTODOCGEN_VERBOSE: true
              run: |
                  npx auto-doc-gen analyze src
                  npx auto-doc-gen export src
                  npx auto-doc-gen save src
```

## Type Conversion

Environment variables are automatically converted to appropriate types:

-   **Boolean**: `"true"` → `true`, `"false"` → `false`
-   **Number**: `"123"` → `123`, `"3.14"` → `3.14`
-   **String**: `"hello"` → `"hello"`
-   **Null**: `"null"` → `null`

## Security Best Practices

### 1. Use Environment Variables for Sensitive Data

```bash
# ❌ Don't put sensitive data in config files
{
  "database": {
    "url": "mongodb://admin:password123@host:27017/db"
  }
}

# ✅ Use environment variables instead
export AUTODOCGEN_DB_URL="mongodb://admin:password123@host:27017/db"
```

### 2. Use .env Files for Development

```bash
# .env file (add to .gitignore)
AUTODOCGEN_DB_URL=mongodb://localhost:27017/dev_docs
AUTODOCGEN_VERBOSE=true
AUTODOCGEN_OUTPUT_DIR=./dev-output
```

```bash
# Load .env file before running commands
source .env
npx auto-doc-gen analyze src
```

### 3. Use Secrets in Production

```bash
# Production - use secure secret management
export AUTODOCGEN_DB_URL="$MONGODB_SECRET_URL"
export AUTODOCGEN_OUTPUT_DIR="$OUTPUT_DIR_SECRET"
```

## Troubleshooting

### Check Environment Variables

```bash
# List all AutoDocGen environment variables
env | grep AUTODOCGEN

# Check specific variable
echo $AUTODOCGEN_DB_URL
```

### Debug Configuration Loading

```bash
# Run with verbose output to see which values are being used
export AUTODOCGEN_VERBOSE=true
npx auto-doc-gen analyze src
```

### Validate Configuration

```bash
# Create config file to see current settings
npx auto-doc-gen config
cat autodocgen.config.json
```

## Migration Guide

### From Config File Only

If you're currently using only config files, you can gradually migrate to environment variables:

1. **Keep existing config file** - it will still work
2. **Add environment variables** for sensitive settings
3. **Test with environment variables** - they will override config file
4. **Remove sensitive data** from config file once environment variables are working

### Example Migration

```bash
# Before: Sensitive data in config file
{
  "database": {
    "url": "mongodb://admin:password@host:27017/db"
  }
}

# After: Use environment variable
export AUTODOCGEN_DB_URL="mongodb://admin:password@host:27017/db"

# Config file can now be safe to commit
{
  "database": {
    "url": "mongodb://localhost:27017/api_docs"
  }
}
```

## Summary

Environment variables provide a secure and flexible way to configure AutoDocGen across different environments. They follow the standard 12-factor app methodology and integrate well with modern deployment practices.
