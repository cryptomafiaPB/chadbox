# Chadbox

> A lightweight, secure, and self-hostable code execution engine built for efficiency, multi-language support, and simple local or remote deployment.

[![Status](https://img.shields.io/badge/status-in%20development-yellow)](https://github.com/cryptomafiaPB/chadbox)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Contributions Welcome](https://img.shields.io/badge/contributions-welcome-brightgreen)](#contributing)

## Overview

Chadbox provides a small, opinionated execution engine for running untrusted code in isolated sandboxes. It exposes a REST API for execution and a `chad` CLI for installing languages, checking health, and managing local runtime state.

It is designed around the code in this repository: TypeScript services, Zod validation, `isolate`-based sandboxing, and a language bundle mounted into the runtime at execution time.

## Features

- Secure sandboxing with `isolate`
- Multi-language execution support
- REST API for programmatic execution
- CLI for install, uninstall, inspection, and benchmarking
- Multi-file execution payloads
- Resource limits for time and memory
- Self-hosted deployment with minimal moving parts

## Installation

### Prerequisites

- Node.js 18 or newer
- pnpm 11 or newer
- Linux host with `isolate` and cgroup support
- Docker

### Local setup

```bash
git clone https://github.com/cryptomafiaPB/chadbox.git
cd chadbox
docker compose up -d --build
```

### Run the API

```bash
docker compose up -d
```

The API starts on port `3000` by default.

### Run the CLI

```bash
docker compose exec chadbox-api bash

chad
```

### CLI commands

```bash
chad list
chad health
chad install <language>
chad uninstall <language>
chad info <language>
chad benchmark <language> --concurrent 20 --total 100
```

Running `chad` with no arguments opens the interactive setup wizard.

## Usage

### Execute code through the API

Send a `POST` request to `/api/v1/execute` with a language, version, and at least one file.

```bash
curl -X POST http://localhost:3000/api/v1/execute \
  -H "Content-Type: application/json" \
  -d '{
    "language": "python3",
    "version": "3.12",
    "files": [
      {
        "name": "main.py",
        "content": "print(\"Hello from Chadbox\")"
      }
    ],
    "stdin": "",
    "args": [],
    "compile_timeout": 10000,
    "run_timeout": 3000,
    "compile_memory_limit": -1,
    "run_memory_limit": -1
  }'
```

### Use the CLI

```bash
pnpm chad list
pnpm chad health
pnpm chad install python3
pnpm chad info python3
pnpm chad benchmark python3 --concurrent 20 --total 100
```

## Examples

### Python example

```json
{
    "language": "python3",
    "version": "3.12",
    "files": [
        {
            "name": "main.py",
            "content": "print(sum(range(10)))"
        }
    ]
}
```

### Multi-file example

```json
{
    "language": "nodejs",
    "version": "20",
    "files": [
        {
            "name": "main.js",
            "content": "import { greet } from './util.js'; console.log(greet('Chadbox'));"
        },
        {
            "name": "util.js",
            "content": "export const greet = (name) => `Hello, ${name}`;"
        }
    ]
}
```

## About the `chad` CLI

The CLI lives in `packages/cli` and wraps common local management tasks around the engine:

- `chad` - opens the interactive wizard when no subcommand is provided
- `chad install <language>` - download and compile a language bundle
- `chad uninstall <language>` - remove an installed language
- `chad list` - show available and installed languages
- `chad info <language>` - inspect an installed language in detail
- `chad health` - validate kernel, `isolate`, and host requirements
- `chad prune` - clean zombie mounts and temporary files
- `chad benchmark [language]` - stress test the engine, defaulting to `python3`

## API Endpoints

### `POST /api/v1/execute`

Executes code in an isolated sandbox.

Required fields:

- `language` - installed language identifier, such as `python3`
- `version` - version string for the selected runtime
- `files` - array of files, each with `name`, `content`, and optional `encoding`

Optional fields:

- `stdin` - standard input passed to the program
- `args` - runtime arguments
- `compile_timeout` - maximum compile time in milliseconds
- `run_timeout` - maximum runtime in milliseconds
- `compile_memory_limit` - compile memory limit
- `run_memory_limit` - run memory limit

Response fields include `language`, `version`, `run`, optional `compile`, and `status`.

### `DELETE /api/v1/system/cache/:language`

Clears the cached mount for a language. This endpoint is intended for local admin use when a language bundle is refreshed.

## Contributing

Contributions are welcome. Please open an issue or pull request with a focused change and include any relevant validation notes.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

## Acknowledgments

Chadbox is inspired by [Piston](https://github.com/engineer-man/piston).

## Support & Discussion

- [Telegram Community](https://t.me/chadbox)
- [Issues & Feature Requests](https://github.com/cryptomafiaPB/chadbox/issues)
- [Discussions](https://github.com/cryptomafiaPB/chadbox/discussions)
