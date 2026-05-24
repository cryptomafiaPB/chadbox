# Contributing to Chadbox

Thank you for your interest in contributing to Chadbox! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

By participating in this project, you agree to be respectful and constructive in all interactions.

## How to Contribute

### Reporting Bugs

- Check if the bug has already been reported in [Issues](https://github.com/cryptomafiaPB/chadbox/issues)
- If not, create a new issue with:
  - Clear title and description
  - Steps to reproduce
  - Expected behavior
  - Actual behavior
  - Your environment (OS, Node version, etc.)

### Suggesting Enhancements

- Use [Issues](https://github.com/cryptomafiaPB/chadbox/issues) to suggest new features
- Clearly describe the enhancement and its use case
- Provide examples of how it would work

### Pull Requests

1. **Fork and Clone**

   ```bash
   git clone https://github.com/your-username/chadbox.git
   cd chadbox
   ```

2. **Set Up Development Environment**

   ```bash
   pnpm install
   ```

3. **Create a Branch**

   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-fix-name
   ```

4. **Make Your Changes**
   - Write clean, well-documented code
   - Follow the existing code style
   - Add tests for new functionality
   - Keep commits atomic and descriptive

5. **Run Quality Checks**

   ```bash
   # Format code
   pnpm format

   # Lint code
   pnpm lint

   # Type check
   pnpm type-check

   # Run tests
   pnpm test
   ```

6. **Commit and Push**

   ```bash
   git add .
   git commit -m "feat: add new feature"
   git push origin feature/your-feature-name
   ```

7. **Open a Pull Request**
   - Use a descriptive title
   - Reference related issues with `Closes #123`
   - Describe your changes clearly
   - Ensure all CI checks pass

## Development Setup

### Prerequisites

- **Node.js**: v18+ (We recommend using [nvm](https://github.com/nvm-sh/nvm) for version management)
- **pnpm**: v10+ (Install globally with `npm install -g pnpm`)

### Project Structure

```
chadbox/
├── packages/
│   ├── core/          # Core execution engine
│   └── shared/        # Shared utilities and types
├── .github/workflows/ # CI/CD workflows
├── tsconfig.json      # Root TypeScript config
├── prettier.config.js # Code formatter config
├── .eslintrc.json     # Linter config
└── pnpm-workspace.yaml
```

### Useful Commands

```bash
# Install dependencies
pnpm install

# Develop a specific package
pnpm --filter @chadbox/core run dev

# Format all code
pnpm format

# Lint all code
pnpm lint

# Type check all packages
pnpm type-check

# Run tests
pnpm test

# Build all packages
pnpm build
```

## Code Style Guidelines

### TypeScript

- Use strict TypeScript (`strict: true`)
- Prefer `const` over `let` over `var`
- Use explicit type annotations for function parameters and returns
- Avoid `any` types - use `unknown` with type guards instead
- Use meaningful variable and function names
- Write JSDoc comments for public APIs

### Formatting

- Use Prettier for code formatting (automatically runs on commit)
- 2 spaces for indentation
- Single quotes for strings
- Semicolons required
- Max line length: 100 characters
- Trailing commas in multi-line objects

### Linting

Code must pass ESLint checks. Key rules:

- No `console.log()` in production code (use `console.warn()` or `console.error()`)
- No unused variables
- Proper error handling
- Type safety

## Commit Message Convention

Use conventional commits for clear git history:

```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Code style changes (formatting, prettier)
- `refactor` - Code refactoring
- `perf` - Performance improvements
- `test` - Test additions or modifications
- `chore` - Build, dependencies, tooling
- `ci` - CI/CD changes

**Example:**

```
feat(core): add timeout support for code execution

Implement configurable timeout mechanism for long-running
code execution to prevent resource exhaustion.

Closes #123
```

## Testing

- Write tests for new features and bug fixes
- Aim for good test coverage
- Use descriptive test names
- Group related tests with `describe()` blocks

## Documentation

- Update README.md if your changes affect usage
- Add comments for complex logic
- Keep documentation up to date with code changes
- Use clear, concise language

## Review Process

- At least one maintainer review required
- All CI checks must pass
- Discussions and feedback will be respectful and constructive
- We may request changes before merging

## Questions?

Feel free to open an issue or reach out to the maintainers. You can also:

- Join our [Telegram community](https://t.me/chadbox)
- Check existing documentation in the README

Thank you for contributing to Chadbox! 🎉
