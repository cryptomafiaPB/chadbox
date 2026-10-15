"use client";

import React, { useState } from "react";
import { Check, Copy } from "lucide-react";
import { copyToClipboard } from "@/lib/utils";
import { useToast } from "./Toast";

export function DualTrack() {
  const [activeTrack, setActiveTrack] = useState<"core" | "cloud">("core");
  const [copiedDocker, setCopiedDocker] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const { showToast } = useToast();

  const dockerCmd = `docker run -d -p 8080:8080 --privileged \\
  -v /sys/fs/cgroup:/sys/fs/cgroup:rw \\
  ghcr.io/chadbox/engine:latest`;

  const curlCmd = `curl -X POST https://api.chadbox.io/v1/execute \\
  -H "Authorization: Bearer cb_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{"language":"python","files":[{"name":"main.py","content":"print(42)"}]}'`;

  const handleCopyDocker = async () => {
    const ok = await copyToClipboard(dockerCmd);
    if (ok) {
      setCopiedDocker(true);
      showToast("Docker command copied to clipboard");
      setTimeout(() => setCopiedDocker(false), 2000);
    }
  };

  const handleCopyCurl = async () => {
    const ok = await copyToClipboard(curlCmd);
    if (ok) {
      setCopiedCurl(true);
      showToast("cURL endpoint copied to clipboard");
      setTimeout(() => setCopiedCurl(false), 2000);
    }
  };

  return (
    <section id="dual-track" className="relative py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-accent/25 bg-emerald-accent/10 px-3 py-1 font-mono text-xs uppercase tracking-wider text-emerald-terminal mb-4">
            Integration Tracks
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl mb-3">
            Two Tracks. Zero Friction.
          </h2>
          <p className="text-base text-text-muted leading-relaxed">
            Deploy self-contained sandboxes on your bare metal, or plug directly into our edge-distributed cloud API.
          </p>
        </div>

        {/* Quick Toggle Switcher */}
        <div className="mb-10 flex justify-center">
          <div className="inline-flex rounded-full border border-subtle bg-[#111417] p-1">
            <button
              onClick={() => setActiveTrack("core")}
              className={`rounded-full px-5 py-2 font-mono text-xs transition-all ${
                activeTrack === "core"
                  ? "border border-emerald-accent/30 bg-surface-elevated text-text-primary shadow-md"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              Track A: Open-Source Core
            </button>
            <button
              onClick={() => setActiveTrack("cloud")}
              className={`rounded-full px-5 py-2 font-mono text-xs transition-all ${
                activeTrack === "cloud"
                  ? "border border-mint-neon/30 bg-surface-elevated text-text-primary shadow-md"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              Track B: Cloud API Service
            </button>
          </div>
        </div>

        {/* 2-Column Split Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Track A Card */}
          <div
            className={`glow-card flex flex-col p-8 rounded-2xl border bg-surface transition-all ${
              activeTrack === "core" ? "border-emerald-accent/40 shadow-xl shadow-emerald-accent/5" : "border-subtle"
            }`}
          >
            <div className="mb-5 flex items-center justify-between">
              <span className="rounded-full border border-emerald-terminal/25 bg-emerald-terminal/10 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-emerald-terminal">
                Self-Hosted Core
              </span>
              <span className="font-mono text-xs text-text-dim">AGPLv3</span>
            </div>

            <h3 className="mb-3 text-2xl font-bold text-text-primary">Open-Source Engine</h3>
            <p className="mb-6 text-sm text-text-muted leading-relaxed">
              A single Linux container with native cgroup v2 control, zero external brokers, and read-only SquashFS mounts. Perfect for on-premise clusters and sensitive compliance boundaries.
            </p>

            <ul className="mb-8 space-y-3 text-sm text-text-primary">
              <li className="flex items-start gap-2.5">
                <Check className="h-4 w-4 text-emerald-accent shrink-0 mt-0.5" />
                <span>Zero external dependencies: No Redis, Postgres, or Celery</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="h-4 w-4 text-emerald-accent shrink-0 mt-0.5" />
                <span>Direct kernel cgroup v2 memory and CPU quotas</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="h-4 w-4 text-emerald-accent shrink-0 mt-0.5" />
                <span>Single binary or single Docker image rollout</span>
              </li>
            </ul>

            <div className="mt-auto overflow-hidden rounded-lg border border-subtle bg-surface-code">
              <div className="flex items-center justify-between border-b border-subtle bg-[#101316] px-3.5 py-2 font-mono text-xs text-text-dim">
                <span>DOCKER CLI</span>
                <button
                  onClick={handleCopyDocker}
                  className="flex items-center gap-1.5 text-text-muted hover:text-text-primary transition-colors"
                >
                  {copiedDocker ? <Check className="h-3 w-3 text-mint-neon" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedDocker ? "Copied!" : "Copy"}</span>
                </button>
              </div>
              <pre className="p-3.5 font-mono text-xs text-emerald-terminal overflow-x-auto whitespace-pre-wrap">
                {dockerCmd}
              </pre>
            </div>
          </div>

          {/* Track B Card */}
          <div
            className={`glow-card flex flex-col p-8 rounded-2xl border bg-surface transition-all ${
              activeTrack === "cloud" ? "border-mint-neon/40 shadow-xl shadow-mint-neon/5" : "border-subtle"
            }`}
          >
            <div className="mb-5 flex items-center justify-between">
              <span className="rounded-full border border-mint-neon/30 bg-mint-neon/10 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-mint-neon">
                Managed Cloud
              </span>
              <span className="font-mono text-xs text-text-dim">Global Endpoints</span>
            </div>

            <h3 className="mb-3 text-2xl font-bold text-text-primary">Managed Cloud API</h3>
            <p className="mb-6 text-sm text-text-muted leading-relaxed">
              Production-ready serverless execution endpoints globally routed with auto-scaling pools, automatic warm language containers, and enterprise rate enforcement.
            </p>

            <ul className="mb-8 space-y-3 text-sm text-text-primary">
              <li className="flex items-start gap-2.5">
                <Check className="h-4 w-4 text-emerald-accent shrink-0 mt-0.5" />
                <span>Sub-40ms warm execution across 12 global regions</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="h-4 w-4 text-emerald-accent shrink-0 mt-0.5" />
                <span>Built-in DDoS protection and token quota budgeting</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="h-4 w-4 text-emerald-accent shrink-0 mt-0.5" />
                <span>Multi-tenant isolation backed by dedicated micro-VM hosts</span>
              </li>
            </ul>

            <div className="mt-auto overflow-hidden rounded-lg border border-subtle bg-surface-code">
              <div className="flex items-center justify-between border-b border-subtle bg-[#101316] px-3.5 py-2 font-mono text-xs text-text-dim">
                <span>CURL API</span>
                <button
                  onClick={handleCopyCurl}
                  className="flex items-center gap-1.5 text-text-muted hover:text-text-primary transition-colors"
                >
                  {copiedCurl ? <Check className="h-3 w-3 text-mint-neon" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedCurl ? "Copied!" : "Copy"}</span>
                </button>
              </div>
              <pre className="p-3.5 font-mono text-xs text-emerald-terminal overflow-x-auto whitespace-pre-wrap">
                {curlCmd}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
