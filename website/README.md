# Chadbox Landing Page

Production-ready product landing page for **Chadbox** — the zero-overhead, kernel-isolated untrusted code execution engine.

Built with **Next.js (App Router)**, **React 18**, **TypeScript**, and **Tailwind CSS**.

## Features

- **High-contrast Developer Aesthetic**: Deep obsidian canvas (`#0B0D0E`), glass cards (`#141719`), and vibrant electric emerald/neon mint gradients (`#10B981` -> `#00F59B`).
- **Interactive Terminal Simulation**: Multi-file payload runner with simulated execution, realistic latency telemetry, and stdout output (hotkey `R`).
- **Dynamic Cursor Proximity Lighting**: Interactive card spotlight following mouse coordinates.
- **Execution Lifecycle Pipeline**: SVG architecture diagram with animated tracer beam, exit failure modes (400, 429), and dynamic node inspection.
- **Dual-Track Quick Toggle**: Compare self-hosted open-source core with managed cloud API.
- **Tiered Pricing & FAQ**: Interactive annual 20% discount switcher and smooth accessible accordion.
- **API Key Generator Modal**: Test API token generation and instant verification cURL snippet.

## Project Structure

```
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout with grid overlay and ambient lighting
│   │   ├── page.tsx           # Assembled single page application
│   │   └── globals.css        # Global design system tokens and Tailwind setup
│   ├── components/
│   │   ├── Navbar.tsx         # Header with pulsing status beacon
│   │   ├── Hero.tsx           # Eyebrow, headline, dual CTAs
│   │   ├── Terminal.tsx       # Interactive multi-file execution sandbox
│   │   ├── DualTrack.tsx      # Open source core vs managed cloud toggle
│   │   ├── Scenarios.tsx      # Bento grid for AI agents, EdTech, indie hackers
│   │   ├── Architecture.tsx   # SVG pipeline with animated tracer beam
│   │   ├── Principles.tsx     # 4 engineering pillar cards
│   │   ├── ComparisonMatrix.tsx # Head-to-head matrix vs Piston and Judge0
│   │   ├── RuntimeGrid.tsx    # Supported runtimes with warm-up latency tags
│   │   ├── Pricing.tsx        # 3-tier pricing cards with annual toggle
│   │   ├── Faq.tsx            # Expandable technical FAQ accordion
│   │   ├── Footer.tsx         # Minimalist dark footer
│   │   ├── ApiKeyModal.tsx    # Instant test key generator modal
│   │   └── Toast.tsx          # Copy status notification toast
│   ├── data/                  # Static datasets for runtimes, comparison, FAQs, pricing
│   └── lib/                   # Utility functions and cursor glow hook
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Build for Production
```bash
npm run build
npm run start
```
