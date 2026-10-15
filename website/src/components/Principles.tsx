"use client";

import React from "react";

export function Principles() {
  const principles = [
    {
      num: "01",
      title: "Kernel-Level Isolation",
      desc: "Chadbox interacts directly with Linux kernel primitives (cgroup v2, seccomp filters, and namespaces) without intermediate hypervisor or daemon bloat.",
      badge: "clone(CLONE_NEWPID | CLONE_NEWNET)",
    },
    {
      num: "02",
      title: "Immutable Language Bundles",
      desc: "Runtimes are packaged as immutable SquashFS images. Sandboxes mount them read-only via loop devices, making tampering or runtime pollution impossible.",
      badge: "mount -o ro,loop python3.12.sqfs",
    },
    {
      num: "03",
      title: "Zero External Dependencies",
      desc: "No Postgres, Redis, RabbitMQ, or Celery queues required. The core engine is a single self-sufficient binary with lockless internal ring buffers.",
      badge: "docker run --privileged",
    },
    {
      num: "04",
      title: "Fail-Safe Under Pressure",
      desc: "Adaptive memory backpressure rejects incoming bursts before host resource thrashing occurs. Memory thresholds cleanly trigger SIGKILL without host cascade.",
      badge: "memory.max & cpu.max enforcement",
    },
  ];

  return (
    <section id="principles" className="relative py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-accent/25 bg-emerald-accent/10 px-3 py-1 font-mono text-xs uppercase tracking-wider text-emerald-terminal mb-4">
            Design Principles
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl mb-3">
            Architected for Speed &amp; Hardness
          </h2>
          <p className="text-base text-text-muted leading-relaxed">
            Every layer exists for a measurable reason. No bloat, no layers of indirection.
          </p>
        </div>

        {/* 2x2 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {principles.map((p) => (
            <div
              key={p.num}
              className="glow-card relative flex flex-col p-8 rounded-2xl border border-subtle bg-surface hover:-translate-y-1 transition-all overflow-hidden"
            >
              {/* Top Accent Line */}
              <div className="absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-emerald-accent to-mint-neon opacity-70" />

              <span className="mb-3 font-mono text-xs text-emerald-terminal">
                PRINCIPLE // {p.num}
              </span>

              <h3 className="mb-2.5 text-xl font-bold text-text-primary">{p.title}</h3>
              <p className="mb-6 text-sm text-text-muted leading-relaxed">{p.desc}</p>

              <div className="mt-auto">
                <span className="inline-block rounded border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 font-mono text-xs text-blue-300">
                  {p.badge}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
