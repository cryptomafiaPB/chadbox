"use client";

import React, { useState, useEffect } from "react";
import { Play, Terminal as TerminalIcon } from "lucide-react";
import { useToast } from "./Toast";

type LanguageKey = "python" | "rust" | "node";

interface LanguageConfig {
  title: string;
  tabLabel: string;
  payload: string;
  generateOutput: (latency: string) => string;
}

const CONFIGS: Record<LanguageKey, LanguageConfig> = {
  python: {
    title: "Python 3.12 (Multi-file)",
    tabLabel: "Python 3.12 (Multi-file)",
    payload: `{
  "language": "python",
  "version": "3.12.3",
  "files": [
    {
      "name": "main.py",
      "content": "from helper import evaluate\\nprint(evaluate(42))"
    },
    {
      "name": "helper.py",
      "content": "def evaluate(n):\\n  return {'status': 'sanitized', 'entropy': n * 1337}"
    }
  ],
  "timeout_ms": 1500,
  "network": false
}`,
    generateOutput: (latency) => `[cgroups] namespace initialized (pid=408221)
[squashfs] mounted python:3.12 (ro,nodev,nosuid) in 4.2ms
[seccomp] loaded 128 blocked syscalls
[exec] worker process started
--------------------------------------------------
{'status': 'sanitized', 'entropy': 56154}
--------------------------------------------------
[exit] returncode: 0 | memory_peak: 14.8MB
[cleanup] cgroup destroyed & namespace unmounted in 1.1ms`,
  },
  rust: {
    title: "Rust 1.78 (Zero-cost)",
    tabLabel: "Rust 1.78",
    payload: `{
  "language": "rust",
  "version": "1.78.0",
  "files": [
    {
      "name": "main.rs",
      "content": "fn main() {\\n    let val: u64 = 42 * 1337;\\n    println!(\\"{\\\\\\"status\\\\\\": \\\\\\"sanitized\\\\\\", \\\\\\"result\\\\\\": {}\\} \\", val);\\n}"
    }
  ],
  "timeout_ms": 2000
}`,
    generateOutput: (latency) => `[cgroups] namespace initialized (pid=409112)
[squashfs] mounted rust:1.78.0 (ro,nodev) in 3.8ms
[rustc] compiled in 22.4ms (release mode cached)
[exec] running binary inside seccomp sandbox
--------------------------------------------------
{"status": "sanitized", "result": 56154}
--------------------------------------------------
[exit] returncode: 0 | memory_peak: 4.2MB
[cleanup] cgroup destroyed in 0.8ms`,
  },
  node: {
    title: "Node.js 22 (V8 Isolate)",
    tabLabel: "Node.js 22",
    payload: `{
  "language": "javascript",
  "version": "22.2.0",
  "files": [
    {
      "name": "index.mjs",
      "content": "import crypto from 'node:crypto';\\nconsole.log({ status: 'sanitized', hash: crypto.randomBytes(4).toString('hex') });"
    }
  ],
  "network": false
}`,
    generateOutput: (latency) => `[cgroups] namespace initialized (pid=409550)
[squashfs] mounted node:22.2.0 (ro,nodev) in 4.9ms
[exec] node --no-warnings index.mjs
--------------------------------------------------
{ status: 'sanitized', hash: 'e92fa1b4' }
--------------------------------------------------
[exit] returncode: 0 | memory_peak: 24.1MB
[cleanup] cgroup destroyed in 1.0ms`,
  },
};

export function TerminalSandbox() {
  const [selectedLang, setSelectedLang] = useState<LanguageKey>("python");
  const [isRunning, setIsRunning] = useState(false);
  const [latency, setLatency] = useState("38.4ms");
  const [output, setOutput] = useState(CONFIGS.python.generateOutput("38.4"));
  const { showToast } = useToast();

  const currentConfig = CONFIGS[selectedLang];

  const handleRun = () => {
    if (isRunning) return;
    setIsRunning(true);
    setOutput("[kernel] dispatching worker process...");

    setTimeout(() => {
      const lat = (36 + Math.random() * 7.5).toFixed(1);
      setLatency(`${lat}ms`);
      setOutput(currentConfig.generateOutput(lat));
      setIsRunning(false);
      showToast(`Execution finished in ${lat}ms`);
    }, 320);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "r" || e.key === "R") && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        handleRun();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedLang, isRunning]);

  return (
    <div className="mx-auto max-w-4xl overflow-hidden rounded-xl border border-subtle bg-surface-code text-left shadow-2xl shadow-emerald-accent/10">
      {/* Window Titlebar */}
      <div className="flex items-center justify-between border-b border-subtle bg-[#111417] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ef4444]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#f59e0b]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#10b981]" />
        </div>
        <div className="flex items-center gap-1.5 font-mono text-xs text-text-muted">
          <TerminalIcon className="h-3.5 w-3.5" />
          <span>sandbox-worker-01.internal &mdash; POST /v1/execute</span>
        </div>
        <div>
          <button
            onClick={handleRun}
            disabled={isRunning}
            className={`inline-flex items-center gap-1.5 rounded border border-emerald-accent/40 bg-emerald-accent/15 px-3 py-1 font-mono text-xs font-semibold text-mint-neon transition-all hover:bg-emerald-accent/25 hover:shadow-lg hover:shadow-emerald-accent/20 ${
              isRunning ? "opacity-60 cursor-not-allowed" : ""
            }`}
            title="Run sandbox execution (Hotkey: R)"
          >
            <Play className="h-3 w-3 fill-current" />
            <span>{isRunning ? "Executing..." : "Run Execution"}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-subtle bg-[#0f1214] px-4">
        {(Object.keys(CONFIGS) as LanguageKey[]).map((lang) => (
          <button
            key={lang}
            onClick={() => {
              setSelectedLang(lang);
              setOutput(CONFIGS[lang].generateOutput(latency.replace("ms", "")));
            }}
            className={`border-b-2 px-4 py-2 font-mono text-xs transition-colors ${
              selectedLang === lang
                ? "border-emerald-accent text-emerald-terminal font-semibold"
                : "border-transparent text-text-dim hover:text-text-muted"
            }`}
          >
            {CONFIGS[lang].tabLabel}
          </button>
        ))}
      </div>

      {/* Split Body */}
      <div className="grid grid-cols-1 md:grid-cols-2 min-h-[300px]">
        {/* Left Pane: Request Payload */}
        <div className="border-b md:border-b-0 md:border-r border-subtle bg-[#0a0d0f] p-5 font-mono text-xs leading-relaxed">
          <div className="mb-3 flex items-center justify-between border-b border-dashed border-white/10 pb-2 text-[11px] text-text-dim uppercase tracking-wider">
            <span>Payload (JSON)</span>
            <span>cgroup: memory=128M</span>
          </div>
          <pre className="overflow-x-auto text-text-primary whitespace-pre-wrap">
            {currentConfig.payload}
          </pre>
        </div>

        {/* Right Pane: Telemetry & Output */}
        <div className="flex flex-col bg-[#0c0f11] p-5 font-mono text-xs leading-relaxed">
          <div className="mb-3 flex items-center justify-between border-b border-dashed border-white/10 pb-2 text-[11px] text-text-dim uppercase tracking-wider">
            <span>Kernel Telemetry</span>
            <div className="flex items-center gap-2">
              <span className="rounded border border-emerald-accent/30 bg-emerald-accent/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-terminal">
                200 OK
              </span>
              <span className="text-[11px] text-text-muted">{latency}</span>
            </div>
          </div>
          <pre className="flex-1 overflow-x-auto whitespace-pre-wrap text-text-muted">
            {output}
          </pre>
        </div>
      </div>
    </div>
  );
}
