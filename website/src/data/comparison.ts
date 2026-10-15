export interface MatrixRow {
  dimension: string;
  chadbox: string;
  chadboxSub?: string;
  piston: string;
  judge0: string;
}

export const COMPARISON_ROWS: MatrixRow[] = [
  {
    dimension: "Isolation",
    chadbox: "`isolate`",
    chadboxSub: "Kernel-level cgroups v2",
    piston: "`isolate`",
    judge0: "`isolate`",
  },
  {
    dimension: "Language Bundles",
    chadbox: "SquashFS",
    chadboxSub: "Read-only, loop-mounted",
    piston: "Copied to disk",
    judge0: "Docker images",
  },
  {
    dimension: "Mount Strategy",
    chadbox: "LRU VFS cache",
    chadboxSub: "Lazy mount & eviction",
    piston: "Static",
    judge0: "Per-container",
  },
  {
    dimension: "Concurrency",
    chadbox: "Adaptive pool",
    chadboxSub: "Backpressure & memory-aware",
    piston: "Fixed workers",
    judge0: "Queue-based",
  },
  {
    dimension: "Stack",
    chadbox: "TypeScript monorepo",
    chadboxSub: "Fastify, Zod schemas",
    piston: "Javascript/Bash mix",
    judge0: "Ruby on Rails",
  },
  {
    dimension: "Self-Hosting",
    chadbox: "Single `docker compose up`",
    chadboxSub: "One container, zero extra services",
    piston: "Custom setup",
    judge0: "Requires Redis, PostgreSQL, workers",
  },
  {
    dimension: "Philosophy",
    chadbox: "Minimal",
    chadboxSub: "One container. No DB, no queue.",
    piston: "Minimal",
    judge0: "Full platform",
  },
];
