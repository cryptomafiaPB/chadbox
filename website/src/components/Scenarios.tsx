"use client";

import React from "react";
import { Bot, Trophy, Zap } from "lucide-react";

export function Scenarios() {
  return (
    <section id="scenarios" className="relative py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-accent/25 bg-emerald-accent/10 px-3 py-1 font-mono text-xs uppercase tracking-wider text-emerald-terminal mb-4">
            Target Workloads
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl mb-3">
            Engineered for Harsh Workloads
          </h2>
          <p className="text-base text-text-muted leading-relaxed">
            From autonomous agents writing arbitrary scripts to high-throughput grading pipelines.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: AI Agents */}
          <div className="glow-card flex flex-col p-8 rounded-2xl border border-subtle bg-surface hover:-translate-y-1 transition-all">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-accent/25 bg-emerald-accent/10 text-mint-neon">
              <Bot className="h-6 w-6" />
            </div>
            <h3 className="mb-2.5 text-xl font-bold text-text-primary">AI Agents &amp; Code Interpreters</h3>
            <p className="mb-6 text-sm text-text-muted leading-relaxed">
              Give autonomous LLMs execution capabilities without risking host compromise. Ephemeral environments spin up, run, and self-destruct in milliseconds.
            </p>
            <div className="mt-auto space-y-2 rounded-lg border border-subtle bg-surface-code p-4 font-mono text-xs">
              <div className="flex justify-between text-text-dim">
                <span>Network Policy:</span>
                <span className="font-semibold text-emerald-terminal">Default Deny</span>
              </div>
              <div className="flex justify-between text-text-dim">
                <span>Filesystem:</span>
                <span className="font-semibold text-emerald-terminal">Scratch tmpfs</span>
              </div>
              <div className="flex justify-between text-text-dim">
                <span>Warmup Overhead:</span>
                <span className="font-semibold text-emerald-terminal">&lt; 14ms</span>
              </div>
            </div>
          </div>

          {/* Card 2: EdTech & Grading */}
          <div className="glow-card flex flex-col p-8 rounded-2xl border border-subtle bg-surface hover:-translate-y-1 transition-all">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-accent/25 bg-emerald-accent/10 text-mint-neon">
              <Trophy className="h-6 w-6" />
            </div>
            <h3 className="mb-2.5 text-xl font-bold text-text-primary">Grading &amp; Coding Platforms</h3>
            <p className="mb-6 text-sm text-text-muted leading-relaxed">
              Execute thousands of student submissions concurrently with microsecond-level CPU time accounting, memory watermarking, and deterministic verdict reporting.
            </p>
            <div className="mt-auto space-y-2 rounded-lg border border-subtle bg-surface-code p-4 font-mono text-xs">
              <div className="flex justify-between text-text-dim">
                <span>CPU Accounting:</span>
                <span className="font-semibold text-emerald-terminal">cpu.stat (microsecond)</span>
              </div>
              <div className="flex justify-between text-text-dim">
                <span>OOM Trap:</span>
                <span className="font-semibold text-emerald-terminal">SIGKILL on Quota</span>
              </div>
              <div className="flex justify-between text-text-dim">
                <span>Throughput:</span>
                <span className="font-semibold text-emerald-terminal">1,200 req/sec / node</span>
              </div>
            </div>
          </div>

          {/* Card 3: Lean Startups */}
          <div className="glow-card flex flex-col p-8 rounded-2xl border border-subtle bg-surface hover:-translate-y-1 transition-all">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-accent/25 bg-emerald-accent/10 text-mint-neon">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="mb-2.5 text-xl font-bold text-text-primary">Lean Startups &amp; Developers</h3>
            <p className="mb-6 text-sm text-text-muted leading-relaxed">
              Bypass Kubernetes complexity and Nomad orchestration overhead. Run a full multi-language sandbox cluster from a single $10/month VPS instance.
            </p>
            <div className="mt-auto space-y-2 rounded-lg border border-subtle bg-surface-code p-4 font-mono text-xs">
              <div className="flex justify-between text-text-dim">
                <span>Infrastructure:</span>
                <span className="font-semibold text-emerald-terminal">1 Docker Container</span>
              </div>
              <div className="flex justify-between text-text-dim">
                <span>Base RAM Footprint:</span>
                <span className="font-semibold text-emerald-terminal">42 MB Idle</span>
              </div>
              <div className="flex justify-between text-text-dim">
                <span>Setup Time:</span>
                <span className="font-semibold text-emerald-terminal">90 Seconds</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
