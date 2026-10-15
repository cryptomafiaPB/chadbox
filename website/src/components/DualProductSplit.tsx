"use client";

import React from "react";
import { Blend } from "lucide-react";
import { useScrollReveal } from "@/lib/useScrollReveal";

interface DualProductSplitProps {
  onOpenApiKeyModal?: () => void;
}

export function DualProductSplit({ onOpenApiKeyModal }: DualProductSplitProps) {
  const { ref, isVisible } = useScrollReveal<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={`mb-48 scroll-reveal ${isVisible ? "scroll-reveal-visible" : ""}`}
    >
      {/* Eyebrow outside the larger box in blue pill form */}
      <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3.5 py-1 font-mono text-xs uppercase tracking-wider text-cyan-400">
        <Blend className="h-3.5 w-3.5 text-cyan-400" />
        <span>Dual-product ecosystem</span>
      </div>

      {/* Larger Split Box Container */}
      <div className="overflow-hidden rounded-3xl">
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/[0.08]">
          
          {/* ===================================================================
              LEFT PANEL: Open-Source Core
          ==================================================================== */}
          <div className="flex flex-col justify-between p-8 sm:p-10">
            <div>
              {/* Title */}
              <h3 className="font-sansation mb-3 text-lg sm:text-xl font-bold tracking-tight text-white leading-tight">
                Open Source Code
              </h3>

              {/* Description */}
              <p className="text-sm text-white/50 leading-relaxed">
                Lightweight execution engine using isolate and Linux cgroups to run untrusted multi-file code safely.
              </p>
            </div>

            {/* Visual: Speedometer / Latency Gauge Graphic (Blue Theme) */}
            <div className="my-8 flex flex-col items-center justify-center">
              <div className="relative w-full max-w-[280px] sm:max-w-[320px]">
                <svg viewBox="0 0 320 180" className="w-full" fill="none">
                  <defs>
                    {/* Gauge Arc Gradient (Blue to match right panel) */}
                    <linearGradient id="gauge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#0284c7" />
                      <stop offset="70%" stopColor="#38bdf8" />
                      <stop offset="100%" stopColor="#7dd3fc" />
                    </linearGradient>

                    {/* Soft Radial Glow */}
                    <radialGradient id="gauge-glow" cx="50%" cy="80%" r="60%">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                    </radialGradient>
                  </defs>

                  {/* Ambient glow behind dial */}
                  <ellipse cx="160" cy="140" rx="110" ry="60" fill="url(#gauge-glow)" className="animate-dial-pulse" />

                  {/* Background Track (semi-circle arc) */}
                  <path
                    d="M 50 140 A 110 110 0 0 1 270 140"
                    stroke="rgba(255, 255, 255, 0.08)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />

                  {/* Active Meter Arc (Blue) */}
                  <path
                    d="M 50 140 A 110 110 0 0 1 160 30"
                    stroke="url(#gauge-gradient)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    className="drop-shadow-[0_0_8px_rgba(56,189,248,0.4)]"
                  />

                  {/* Indicator needle tick */}
                  <line
                    x1="160"
                    y1="30"
                    x2="160"
                    y2="42"
                    stroke="#38bdf8"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />

                  {/* Metric Readout */}
                  <text
                    x="160"
                    y="108"
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize="32"
                    fontWeight="bold"
                    fontFamily="Sansation, sans-serif"
                  >
                    45ms
                  </text>
                  <text
                    x="160"
                    y="130"
                    textAnchor="middle"
                    fill="rgba(255, 255, 255, 0.5)"
                    fontSize="10"
                    letterSpacing="0.1em"
                    fontFamily="ui-monospace, monospace"
                  >
                    KERNEL ISOLATION SPEED
                  </text>
                </svg>
              </div>
            </div>
          </div>

          {/* ===================================================================
              RIGHT PANEL: The Cloud API Service
          ==================================================================== */}
          <div className="flex flex-col justify-between p-8 sm:p-10">
            <div>
              {/* Title */}
              <h3 className="font-sansation mb-3 text-lg sm:text-xl font-bold tracking-tight text-white leading-tight">
                Cloud API Service
              </h3>

              {/* Description */}
              <p className="text-sm text-white/50 leading-relaxed">
                Production-ready cloud API featuring a global Cloudflare gateway and scalable multi-cloud execution plane.
              </p>
            </div>

            {/* Visual: 3D Isometric Isolated Sandbox Box Graphic */}
            <div className="my-8 flex flex-col items-center justify-center">
              <div className="relative w-full max-w-[280px] sm:max-w-[320px]">
                <svg viewBox="0 0 320 180" className="w-full" fill="none">
                  <defs>
                    {/* Isometric Box Gradients */}
                    <linearGradient id="iso-top" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#0284c7" stopOpacity="0.10" />
                    </linearGradient>
                    <linearGradient id="iso-left" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#0284c7" stopOpacity="0.30" />
                      <stop offset="100%" stopColor="#0369a1" stopOpacity="0.05" />
                    </linearGradient>
                    <linearGradient id="iso-right" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.22" />
                      <stop offset="100%" stopColor="#0284c7" stopOpacity="0.05" />
                    </linearGradient>

                    {/* Drop Glow */}
                    <radialGradient id="iso-glow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.20" />
                      <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                    </radialGradient>
                  </defs>

                  {/* Host Infrastructure Base Blocks (dim gray pedestals below) */}
                  <path d="M 60 145 L 110 125 L 150 142 L 100 162 Z" fill="#14181b" stroke="rgba(255,255,255,0.06)" />
                  <path d="M 60 145 L 100 162 L 100 172 L 60 155 Z" fill="#0d1012" stroke="rgba(255,255,255,0.04)" />
                  <path d="M 100 162 L 150 142 L 150 152 L 100 172 Z" fill="#111417" stroke="rgba(255,255,255,0.04)" />

                  <path d="M 170 142 L 215 125 L 260 145 L 215 162 Z" fill="#14181b" stroke="rgba(255,255,255,0.06)" />
                  <path d="M 170 142 L 215 162 L 215 172 L 170 152 Z" fill="#0d1012" stroke="rgba(255,255,255,0.04)" />
                  <path d="M 215 162 L 260 145 L 260 155 L 215 172 Z" fill="#111417" stroke="rgba(255,255,255,0.04)" />

                  {/* Vertical Dotted Isolation Projection Lines */}
                  <line x1="110" y1="88" x2="110" y2="135" stroke="rgba(56, 189, 248, 0.45)" strokeDasharray="4 4" strokeWidth="1.2" className="animate-projection-flow" />
                  <line x1="160" y1="110" x2="160" y2="152" stroke="rgba(56, 189, 248, 0.55)" strokeDasharray="4 4" strokeWidth="1.2" className="animate-projection-flow" />
                  <line x1="210" y1="88" x2="210" y2="135" stroke="rgba(56, 189, 248, 0.45)" strokeDasharray="4 4" strokeWidth="1.2" className="animate-projection-flow" />

                  {/* Floating 3D Isometric Sandbox Cube with gentle float */}
                  <g className="animate-float-gentle">
                    {/* Ambient Glow behind floating box */}
                    <ellipse cx="160" cy="78" rx="80" ry="40" fill="url(#iso-glow)" />

                    {/* Left Face */}
                    <path
                      d="M 110 50 L 160 72 L 160 110 L 110 88 Z"
                      fill="url(#iso-left)"
                      stroke="#38bdf8"
                      strokeWidth="1.5"
                      className="drop-shadow-[0_0_8px_rgba(56,189,248,0.3)]"
                    />
                    {/* Right Face */}
                    <path
                      d="M 160 72 L 210 50 L 210 88 L 160 110 Z"
                      fill="url(#iso-right)"
                      stroke="#38bdf8"
                      strokeWidth="1.5"
                      className="drop-shadow-[0_0_8px_rgba(56,189,248,0.3)]"
                    />
                    {/* Top Face */}
                    <path
                      d="M 160 28 L 210 50 L 160 72 L 110 50 Z"
                      fill="url(#iso-top)"
                      stroke="#38bdf8"
                      strokeWidth="1.5"
                      className="drop-shadow-[0_0_10px_rgba(56,189,248,0.4)]"
                    />

                    {/* Internal Wireframe Accent */}
                    <line x1="160" y1="72" x2="160" y2="110" stroke="#38bdf8" strokeWidth="1.5" />
                    <line x1="110" y1="50" x2="160" y2="72" stroke="#38bdf8" strokeWidth="1.5" />
                    <line x1="160" y1="72" x2="210" y2="50" stroke="#38bdf8" strokeWidth="1.5" />
                  </g>
                </svg>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
