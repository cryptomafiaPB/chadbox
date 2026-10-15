"use client";

import React, { useState } from "react";
import { PIPELINE_NODES, PipelineNodeData } from "@/data/pipeline";

type PathMode = "success" | "validation" | "capacity";

export function Architecture() {
  const [activePath, setActivePath] = useState<PathMode>("success");
  const [activeNode, setActiveNode] = useState<PipelineNodeData>(PIPELINE_NODES["node-exec"]);

  const handlePathChange = (path: PathMode) => {
    setActivePath(path);
    if (path === "success") {
      setActiveNode(PIPELINE_NODES["node-exec"]);
    } else if (path === "validation") {
      setActiveNode({
        id: "fail-400",
        title: "400 Bad Request Exit",
        desc: "Payload failed schema or syntax validation. The request terminates early before allocating cgroups or mounting disks.",
        latency: "~1.2ms",
        isolation: "Zero Resource Waste",
      });
    } else if (path === "capacity") {
      setActiveNode({
        id: "fail-429",
        title: "429 Concurrency Gate Exit",
        desc: "Host memory or concurrency ceiling reached. Graceful backpressure signals caller to retry without thrashing the server.",
        latency: "~0.5ms",
        isolation: "Host Protection",
      });
    }
  };

  const getTracerD = () => {
    switch (activePath) {
      case "validation":
        return "M 80 80 L 260 80 L 260 145";
      case "capacity":
        return "M 80 80 L 260 80 L 460 80 L 460 145";
      case "success":
      default:
        return "M 80 80 L 260 80 L 460 80 L 660 80 L 860 80";
    }
  };

  const getTracerStroke = () => {
    switch (activePath) {
      case "validation":
        return "#EF4444";
      case "capacity":
        return "#F59E0B";
      case "success":
      default:
        return "var(--tw-colors-mint-neon, #00F59B)";
    }
  };

  return (
    <section id="how-it-works" className="relative py-24 scroll-mt-16">
      <div id="architecture" className="sr-only" />
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-accent/25 bg-emerald-accent/10 px-3 py-1 font-mono text-xs uppercase tracking-wider text-emerald-terminal mb-4">
            Execution Lifecycle
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl mb-3">
            Sub-Millisecond Pipeline Architecture
          </h2>
          <p className="text-base text-text-muted leading-relaxed">
            Trace how a request transforms from raw JSON to isolated kernel namespaces with zero intermediate database locks.
          </p>
        </div>

        {/* Architecture Card */}
        <div className="overflow-hidden rounded-3xl border border-subtle bg-[#0f1214] p-8 md:p-10 shadow-2xl">
          {/* Path Selector Controls */}
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <span className="font-mono text-xs uppercase text-text-dim">
              Execution Path Simulation:
            </span>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handlePathChange("success")}
                className={`rounded-full px-3.5 py-1.5 font-mono text-xs transition-all ${
                  activePath === "success"
                    ? "border border-emerald-accent bg-emerald-accent/15 text-mint-neon font-semibold"
                    : "border border-subtle bg-[#14181b] text-text-muted hover:text-text-primary"
                }`}
              >
                200 OK (Clean Exit)
              </button>

              <button
                onClick={() => handlePathChange("validation")}
                className={`rounded-full px-3.5 py-1.5 font-mono text-xs transition-all ${
                  activePath === "validation"
                    ? "border border-red-500 bg-red-500/15 text-red-400 font-semibold"
                    : "border border-subtle bg-[#14181b] text-text-muted hover:text-text-primary"
                }`}
              >
                400 Bad Request
              </button>

              <button
                onClick={() => handlePathChange("capacity")}
                className={`rounded-full px-3.5 py-1.5 font-mono text-xs transition-all ${
                  activePath === "capacity"
                    ? "border border-amber-500 bg-amber-500/15 text-amber-400 font-semibold"
                    : "border border-subtle bg-[#14181b] text-text-muted hover:text-text-primary"
                }`}
              >
                429 Concurrency Gate
              </button>
            </div>
          </div>

          {/* SVG Pipeline Diagram */}
          <div className="w-full overflow-x-auto py-4">
            <svg className="h-[200px] w-full min-w-[860px]" viewBox="0 0 960 180" fill="none">
              {/* Background Path */}
              <path d="M 80 80 L 260 80 L 460 80 L 660 80 L 860 80" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />

              {/* Animated Tracer Beam */}
              <path
                d={getTracerD()}
                stroke={getTracerStroke()}
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
                strokeDasharray="20 280"
                className="animate-tracer"
              />

              {/* Failure Branch 1 (400) */}
              <path d="M 260 80 L 260 135" stroke="rgba(239, 68, 68, 0.35)" strokeWidth="2" strokeDasharray="4 4" />
              {/* Failure Branch 2 (429) */}
              <path d="M 460 80 L 460 135" stroke="rgba(245, 158, 11, 0.35)" strokeWidth="2" strokeDasharray="4 4" />

              {/* Node 1: POST /v1/execute */}
              <g
                className="cursor-pointer transition-transform hover:scale-105"
                onClick={() => setActiveNode(PIPELINE_NODES["node-ingest"])}
                transform="translate(20, 45)"
              >
                <rect width="120" height="70" rx="8" fill="#141719" stroke="#22272B" strokeWidth="1" />
                <text x="60" y="32" fill="#F3F4F6" fontSize="11" fontWeight="700" textAnchor="middle" fontFamily="ui-monospace">
                  POST
                </text>
                <text x="60" y="48" fill="#9CA3AF" fontSize="10" textAnchor="middle" fontFamily="ui-monospace">
                  /v1/execute
                </text>
              </g>

              {/* Node 2: JSON Schema Validation */}
              <g
                className="cursor-pointer transition-transform hover:scale-105"
                onClick={() => setActiveNode(PIPELINE_NODES["node-validate"])}
                transform="translate(200, 45)"
              >
                <rect width="130" height="70" rx="8" fill="#141719" stroke="#22272B" strokeWidth="1" />
                <text x="65" y="32" fill="#F3F4F6" fontSize="11" fontWeight="700" textAnchor="middle" fontFamily="ui-monospace">
                  Schema
                </text>
                <text x="65" y="48" fill="#9CA3AF" fontSize="10" textAnchor="middle" fontFamily="ui-monospace">
                  Fast Validation
                </text>
              </g>

              {/* Tag 400 Bad Request */}
              <g transform="translate(225, 138)">
                <rect width="80" height="26" rx="4" fill="rgba(239, 68, 68, 0.15)" stroke="#EF4444" strokeWidth="1" />
                <text x="40" y="17" fill="#FCA5A5" fontSize="9.5" fontWeight="600" textAnchor="middle" fontFamily="ui-monospace">
                  400 Bad Req
                </text>
              </g>

              {/* Node 3: Concurrency & RAM Gate */}
              <g
                className="cursor-pointer transition-transform hover:scale-105"
                onClick={() => setActiveNode(PIPELINE_NODES["node-gate"])}
                transform="translate(400, 45)"
              >
                <rect width="130" height="70" rx="8" fill="#141719" stroke="#22272B" strokeWidth="1" />
                <text x="65" y="32" fill="#F3F4F6" fontSize="11" fontWeight="700" textAnchor="middle" fontFamily="ui-monospace">
                  RAM &amp; CPU Gate
                </text>
                <text x="65" y="48" fill="#9CA3AF" fontSize="10" textAnchor="middle" fontFamily="ui-monospace">
                  cgroup Allocator
                </text>
              </g>

              {/* Tag 429 */}
              <g transform="translate(425, 138)">
                <rect width="80" height="26" rx="4" fill="rgba(245, 158, 11, 0.15)" stroke="#F59E0B" strokeWidth="1" />
                <text x="40" y="17" fill="#FCD34D" fontSize="9.5" fontWeight="600" textAnchor="middle" fontFamily="ui-monospace">
                  429 Wait/Drop
                </text>
              </g>

              {/* Node 4: Language Mount */}
              <g
                className="cursor-pointer transition-transform hover:scale-105"
                onClick={() => setActiveNode(PIPELINE_NODES["node-mount"])}
                transform="translate(600, 45)"
              >
                <rect width="130" height="70" rx="8" fill="#141719" stroke="#22272B" strokeWidth="1" />
                <text x="65" y="32" fill="#F3F4F6" fontSize="11" fontWeight="700" textAnchor="middle" fontFamily="ui-monospace">
                  SquashFS Mount
                </text>
                <text x="65" y="48" fill="#9CA3AF" fontSize="10" textAnchor="middle" fontFamily="ui-monospace">
                  LRU Read-Only
                </text>
              </g>

              {/* Node 5: Sandbox Execution */}
              <g
                className="cursor-pointer transition-transform hover:scale-105"
                onClick={() => setActiveNode(PIPELINE_NODES["node-exec"])}
                transform="translate(800, 45)"
              >
                <rect width="130" height="70" rx="8" fill="#141719" stroke="#10B981" strokeWidth="1.5" />
                <text x="65" y="32" fill="#00F59B" fontSize="11" fontWeight="700" textAnchor="middle" fontFamily="ui-monospace">
                  Isolated Exec
                </text>
                <text x="65" y="48" fill="#34D399" fontSize="10" textAnchor="middle" fontFamily="ui-monospace">
                  200 OK Verdict
                </text>
              </g>
            </svg>
          </div>

          {/* Dynamic Inspector Drawer */}
          <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-subtle bg-[#13171a] p-5">
            <div>
              <h4 className="text-sm font-bold text-text-primary mb-1">{activeNode.title}</h4>
              <p className="text-xs text-text-muted">{activeNode.desc}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="rounded border border-subtle bg-canvas px-3 py-1 font-mono text-xs text-text-muted">
                Latency: <span className="font-semibold text-emerald-terminal">{activeNode.latency}</span>
              </div>
              <div className="rounded border border-subtle bg-canvas px-3 py-1 font-mono text-xs text-text-muted">
                Isolation: <span className="font-semibold text-emerald-terminal">{activeNode.isolation}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
