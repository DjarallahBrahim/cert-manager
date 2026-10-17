# Language Context

## go

# Go Language Prompt Snippet

## Key Concepts

- **Goroutines**: Lightweight concurrent functions launched with `go` keyword
- **Channels**: Typed conduits for communication and synchronization between goroutines
- **Interfaces**: Implicitly satisfied contracts — no `implements` keyword needed
- **Struct Embedding**: Composition mechanism providing field and method promotion
- **Error Handling**: Explicit error return values (`error` interface) instead of exceptions
- **Defer/Panic/Recover**: Deferred cleanup, unrecoverable errors, and recovery mechanism
- **Slices vs Arrays**: Arrays are fixed-size values; slices are dynamic views backed by arrays
- **Pointers**: Explicit pointer types for pass-by-reference semantics (no pointer arithmetic)
- **Context Propagation**: `context.Context` carries deadlines, cancellation, and request-scoped values
- **Init Functions**: Package-level `init()` runs automatically before `main()` for setup

## Import Patterns

- `import "package"` — single package import
- `import alias "package"` — aliased import to avoid name conflicts
- `import ( ... )` — grouped import block (standard library, then external, then internal)
- `import _ "package"` — blank import for side effects only (e.g., driver registration)

## File Patterns

- `*_test.go` — test files in the same package (or `_test` package for black-box tests)
- `cmd/` — directory containing main packages (binary entry points)
- `internal/` — packages only importable by parent module (enforced by compiler)
- `pkg/` — public library packages (convention, not enforced)
- `go.mod` — module definition with dependency versions
- `go.sum` — cryptographic checksums for dependencies

## Common Frameworks

- **Gin** — High-performance HTTP framework with middleware support
- **Echo** — Minimalist web framework with built-in middleware
- **Fiber** — Express-inspired framework built on fasthttp
- **Chi** — Lightweight, composable HTTP router
- **GORM** — ORM library with associations, hooks, and migrations

## Example Language Notes

> Implements `io.Reader` interface implicitly — no explicit declaration needed, just
> matching method signatures. This enables any type with a `Read([]byte) (int, error)`
> method to be used wherever `io.Reader` is expected.
>
> The `internal/` directory enforces encapsulation at the compiler level, preventing
> external packages from importing implementation details — stronger than naming convention.


## yaml

# YAML Language Prompt Snippet

## Key Concepts

- **Indentation-Based Nesting**: Whitespace-sensitive structure (spaces only, no tabs) defining hierarchy
- **Anchors and Aliases**: `&anchor` defines a reusable block, `*anchor` references it to avoid duplication
- **Merge Keys**: `<<: *anchor` merges anchor contents into the current mapping
- **Multi-Line Strings**: Literal block (`|`) preserves newlines, folded block (`>`) joins lines
- **Document Separators**: `---` starts a new document, `...` ends one (multi-document streams)
- **Tags and Types**: `!!str`, `!!int`, `!!bool` for explicit typing; custom tags for application-specific types
- **Flow Style**: Inline JSON-like syntax `{key: value}` and `[item1, item2]` for compact notation
- **Environment Variable Substitution**: `${VAR}` patterns used in docker-compose and CI configs

## Notable File Patterns

- `docker-compose.yml` / `docker-compose.yaml` — Multi-container Docker application definition
- `.github/workflows/*.yml` — GitHub Actions CI/CD workflow definitions
- `.gitlab-ci.yml` — GitLab CI/CD pipeline configuration
- `kubernetes/*.yaml` / `k8s/*.yaml` — Kubernetes resource manifests
- `*.config.yaml` — Application configuration files
- `mkdocs.yml` — MkDocs documentation site configuration
- `serverless.yml` — Serverless Framework configuration

## Edge Patterns

- YAML config files `configures` the code modules they control (e.g., database settings affect data layer)
- CI/CD YAML files `triggers` build and deployment pipelines
- docker-compose YAML `deploys` services and `depends_on` Dockerfiles
- Kubernetes YAML `deploys` and `provisions` application services

## Summary Style

> "Docker Compose configuration defining N services with networking, volumes, and health checks."
> "GitHub Actions workflow running tests on push and deploying to production on merge to main."
> "Kubernetes deployment manifest with N replicas, resource limits, and liveness probes."


## markdown

# Markdown Language Prompt Snippet

## Key Concepts

- **Heading Hierarchy**: `#` through `######` for document structure, with h1 as the title
- **Front Matter**: YAML metadata between `---` delimiters at the top of the file
- **Fenced Code Blocks**: Triple backticks with optional language identifier for syntax highlighting
- **Reference-Style Links**: `[text][ref]` with `[ref]: url` definitions, useful for repeated URLs
- **Tables**: Pipe-delimited columns with alignment markers (`:---`, `:---:`, `---:`)
- **Admonitions**: Blockquote-based callouts (`> **Note:**`, `> **Warning:**`) for emphasis
- **Task Lists**: `- [ ]` and `- [x]` for checklists in issue trackers and READMEs
- **HTML Embedding**: Raw HTML allowed inline for features Markdown does not support natively

## Notable File Patterns

- `README.md` — Project overview and entry point for new contributors (high-value)
- `CONTRIBUTING.md` — Contribution guidelines, code style, PR process
- `CHANGELOG.md` — Version history following Keep a Changelog or similar format
- `docs/**/*.md` — Documentation directory with guides, API references, tutorials
- `*.md` in source directories — Co-located documentation for modules or packages
- `ADR-*.md` or `adr/*.md` — Architecture Decision Records

## Edge Patterns

- Markdown files `documents` the code components they describe or reference
- Links to other `.md` files create `related` edges between documentation nodes
- Code block references mentioning file paths may imply `documents` edges to those files
- README files in subdirectories typically `documents` the module at that path

## Summary Style

> "Project overview documentation with N sections covering installation, usage, and API reference."
> "Architecture Decision Record documenting the choice of [technology] for [purpose]."
> "Contributing guide with code style rules, testing requirements, and pull request process."


## json

# JSON Language Prompt Snippet

## Key Concepts

- **Strict Syntax**: No trailing commas, no comments (unlike JSONC or JSON5), double-quoted strings only
- **Data Types**: Objects, arrays, strings, numbers, booleans, and null — no undefined or date types
- **Nested Structure**: Arbitrary nesting depth for hierarchical configuration or data
- **Schema Validation**: JSON Schema (`$schema` keyword) for validating structure and types
- **JSONC**: JSON with Comments variant used by VS Code, tsconfig.json, and other tooling
- **JSON5**: Extended JSON allowing comments, trailing commas, unquoted keys, and more
- **JSON Lines** (`.jsonl`): One JSON object per line for streaming data processing

## Notable File Patterns

- `package.json` — Node.js project manifest with dependencies, scripts, and metadata
- `tsconfig.json` — TypeScript compiler configuration (actually JSONC)
- `.eslintrc.json` — ESLint linting rules and configuration
- `*.schema.json` — JSON Schema definitions for validation
- `composer.json` — PHP Composer project manifest
- `appsettings.json` — .NET application configuration
- `manifest.json` — Browser extension or PWA manifest

## Edge Patterns

- `package.json` `configures` the build toolchain and defines project dependencies
- `tsconfig.json` `configures` TypeScript compilation for all `.ts` files
- JSON Schema files `defines_schema` for API request/response validation
- Config JSON files `configures` the runtime behavior of the application

## Summary Style

> "Node.js project manifest defining N dependencies, build scripts, and project metadata."
> "TypeScript compiler configuration enabling strict mode with path aliases for monorepo packages."
> "JSON Schema defining the request/response structure for the user API endpoint."


## shell

# Shell Language Prompt Snippet

## Key Concepts

- **Shebang Line**: `#!/bin/bash` or `#!/usr/bin/env bash` specifying the interpreter
- **Variables**: `VAR=value` assignment, `$VAR` or `${VAR}` expansion, no spaces around `=`
- **Functions**: `function name()` or `name()` for reusable command groups
- **Conditionals**: `if [[ condition ]]; then ... fi` with `[[ ]]` for extended tests
- **Loops**: `for item in list`, `while condition`, `until condition` iteration patterns
- **Pipes and Redirection**: `|` for chaining commands, `>` / `>>` / `2>&1` for output redirection
- **Exit Codes**: `$?` captures last command status; `set -e` exits on any failure
- **Strict Mode**: `set -euo pipefail` for robust error handling (exit on error, undefined vars, pipe failures)
- **Command Substitution**: `$(command)` captures command output as a string
- **Here Documents**: `<<EOF ... EOF` for multi-line string input to commands

## Notable File Patterns

- `*.sh` / `*.bash` — Shell script files
- `scripts/*.sh` — Project automation scripts (build, deploy, setup)
- `entrypoint.sh` — Docker container entry point script
- `install.sh` / `setup.sh` — Environment setup scripts
- `.bashrc` / `.bash_profile` / `.zshrc` — Shell configuration files

## Edge Patterns

- Shell scripts `triggers` other scripts or build processes they invoke
- Entry point scripts `deploys` the application they start
- Setup scripts `configures` the development environment
- Build scripts `depends_on` the source files they compile or package

## Summary Style

> "Build automation script compiling TypeScript, running tests, and packaging the release artifact."
> "Docker entry point script handling signal forwarding and graceful shutdown."
> "Environment setup script installing dependencies and configuring development tools."


