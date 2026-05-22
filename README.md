# Chadbox

> A lightweight, secure, and self-hostable code execution engine designed for efficiency and ease of use.

[![Status](https://img.shields.io/badge/status-in%20development-yellow)](https://github.com/your-org/chadbox)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Contributions Welcome](https://img.shields.io/badge/contributions-welcome-brightgreen)](#contributing)

## Overview

Chadbox is a general-purpose code execution engine that runs efficiently on minimal infrastructure. Inspired by [Piston](https://github.com/engineer-man/piston), it provides secure sandboxing, multi-language support, and an intuitive API—designed to run comfortably on a $6-12/month cloud instance.

**Status:** 🚧 In active development | **Community:** [Join our Telegram](https://t.me/chadbox)

## Features

- **Lightweight & Fast** – Low latency, high throughput execution
- **Secure Sandboxing** – [isolate](https://github.com/ioi/isolate) and Docker-based isolation
- **Multi-Language Support** – Execute code in various programming languages
- **Easy-to-Use API** – Simple, well-documented REST API
- **Self-Hosted** – Full control, no vendor lock-in
- **CLI Tool** – Convenient command-line interface
- **LLM-Ready** – Structured APIs suitable for AI model integration
- **Multi-File Support** – Execute complex projects with multiple files

## What Sets Chadbox Apart

Compared to Piston, Chadbox offers:

- **Better Performance** – Optimized for lower latency and higher throughput
- **Easier Setup** – Simplified installation and configuration
- **Resource Efficiency** – Runs lean on minimal hardware
- **Improved Developer Experience** – Simpler API, comprehensive documentation, enhanced CLI
- **Better Monitoring** – Built-in observability features
- **More Flexible** – Configurable logging, resource limits, and more

## Tech Stack

- **Language:** TypeScript
- **Validation:** Zod
- **Sandboxing:** isolate (system-level), Docker (container-based)
- **Runtime:** Node.js with Shell scripting

## Quick Start

<!-- ### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/chadbox.git
cd chadbox

# Install dependencies
npm install

# Configure (see Configuration section)
cp .env.example .env

# Start the server
npm start
``` -->

<!-- ### Basic Usage

```bash
# Via API
curl -X POST http://localhost:5000/execute \
  -H "Content-Type: application/json" \
  -d '{
    "language": "python",
    "code": "print(\"Hello, Chadbox!\")"
  }'

# Via CLI
chadbox execute --language python --file script.py
``` -->

<!-- ## Documentation

- [API Reference](./docs/api.md) – Complete endpoint documentation
- [Supported Languages](./docs/languages.md) – Available programming languages
- [Installation Guide](./docs/installation.md) – Detailed setup instructions
- [Configuration](./docs/configuration.md) – Environment and resource settings
- [Security Considerations](./docs/security.md) – Sandboxing and best practices -->

<!-- ## Requirements

- Node.js 16+
- Docker (optional, for container-based sandboxing)
- isolate (for system-level sandboxing)
- 512MB+ RAM
- Linux-based OS (Ubuntu, Debian, etc.) -->

<!-- ## Configuration

Environment variables (see `.env.example`):

```bash
PORT=5000
SANDBOX_TYPE=isolate          # or 'docker'
MAX_EXECUTION_TIME=5000       # milliseconds
MAX_MEMORY=256                # MB
LOG_LEVEL=info
``` -->

## Contributing

Contributions are welcome! Please:

<!-- 1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request -->

## License

This project is licensed under the MIT License – see [LICENSE](LICENSE) for details.

## Acknowledgments

Built with inspiration from [Piston](https://github.com/engineer-man/piston) – an excellent code execution engine.

## Support & Discussion

- 💬 [Telegram Community](https://t.me/chadbox)
- 📝 [Issues & Feature Requests](https://github.com/chadbox/issues)
- 💡 [Discussions](https://github.com/chadbox/discussions)
