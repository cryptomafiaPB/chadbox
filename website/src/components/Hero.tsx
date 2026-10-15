"use client";

import React, { useRef } from "react";
import { ArrowRight, Github } from "lucide-react";
import { DualProductSplit } from "./DualProductSplit";
import { UsageGuide } from "./UsageGuide";
import { UseCases } from "./UseCases";

interface HeroProps {
  onOpenApiKeyModal: () => void;
}

export function Hero({ onOpenApiKeyModal }: HeroProps) {
  const heroRef = useRef<HTMLElement>(null);

  return (
    <section ref={heroRef} id="hero" className="relative pt-[120px] pb-48 text-left overflow-hidden">
      {/* Subtle Grid Background (Only for Hero section, fades out as section ends) */}
      <div className="hero-grid-overlay" aria-hidden="true" />

      <div className="relative z-10 mx-auto max-w-6xl px-6">
        <div className="max-w-3xl">
          {/* Eyebrow
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-accent/30 bg-emerald-accent/5 px-4 py-1 text-xs font-medium text-text-primary shadow-lg shadow-emerald-accent/15 mb-7">
            <span className="rounded bg-emerald-accent/20 px-1.5 py-0.5 font-mono text-[11px] text-emerald-terminal">
              CORE + CLOUD
            </span>
            <span>Open-Source Engine + Production-Ready Cloud API</span>
          </div>
          */}

          {/* Headline */}
          <h1 className="font-sansation mb-6 text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white leading-[1.15]">
            Run untrusted code without{" "}
            <br className="hidden sm:inline" />
            running the infrastructure.
          </h1>

          {/* Subheadline */}
          <p className="mb-10 max-w-2xl text-lg text-white/60 leading-relaxed">
            Execute untrusted code instantly via our lightweight, kernel-isolated Cloud API, or self-host in a single container.
          </p>

          {/* Dual CTAs */}
          <div className="mb-48 flex flex-wrap items-center justify-start gap-4">
            <button
              onClick={onOpenApiKeyModal}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-accent to-mint-neon px-6 py-3 text-sm font-semibold text-[#07150f] shadow-xl shadow-mint-neon/25 hover:scale-105 transition-all"
            >
              <span>Get started</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <a
              href="https://github.com/chadbox/chadbox"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-subtle bg-surface/70 px-6 py-3 text-sm font-medium text-text-primary backdrop-blur-md hover:border-emerald-accent/40 hover:bg-surface-elevated transition-all"
            >
              <Github className="h-4 w-4" />
              <span>View on GitHub</span>
            </a>
          </div>
        </div>

        {/* Dual Product Ecosystem Split Section */}
        <DualProductSplit onOpenApiKeyModal={onOpenApiKeyModal} />

        {/* Two Ways to Use Chadbox (Quickstart / Deployment Options) */}
        <UsageGuide />

        {/* When Should I Use This? / Synthesized Target Workloads */}
        <UseCases />
      </div>
    </section>
  );
}
