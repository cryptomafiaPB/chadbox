export interface PipelineNodeData {
  id: string;
  title: string;
  desc: string;
  latency: string;
  isolation: string;
}

export const PIPELINE_NODES: Record<string, PipelineNodeData> = {
  "node-ingest": {
    id: "node-ingest",
    title: "HTTP POST Ingestion (/v1/execute)",
    desc: "High-speed epoll-driven event loop parses the HTTP payload into pre-allocated memory buffers.",
    latency: "~0.4ms",
    isolation: "Layer 7 Gateway",
  },
  "node-validate": {
    id: "node-validate",
    title: "Zero-Allocation JSON Schema Validation",
    desc: "Fast schema checker validates file structures, language identifiers, timeout limits, and memory requests.",
    latency: "~0.8ms",
    isolation: "In-Memory Validator",
  },
  "node-gate": {
    id: "node-gate",
    title: "Concurrency & RAM Gate (Backpressure)",
    desc: "Adaptive token bucket monitors host memory headroom and cgroup limits. Queues or drops excess load before host degradation.",
    latency: "~0.3ms",
    isolation: "cgroup v2 controller",
  },
  "node-mount": {
    id: "node-mount",
    title: "Immutable SquashFS Language Mount",
    desc: "Language root filesystem is mounted read-only via loopback in constant time using an LRU mount cache.",
    latency: "~4.2ms",
    isolation: "RO Loop Mount",
  },
  "node-exec": {
    id: "node-exec",
    title: "Sandbox Execution (cgroup v2 & namespaces)",
    desc: "The payload process executes within dedicated mount, UTS, IPC, PID, and net namespaces with strict seccomp filters.",
    latency: "~31.2ms",
    isolation: "L3 Kernel Isolation",
  },
};
