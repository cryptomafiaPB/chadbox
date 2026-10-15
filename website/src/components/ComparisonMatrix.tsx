"use client";

import React from "react";
import { COMPARISON_ROWS } from "@/data/comparison";
import { useScrollReveal } from "@/lib/useScrollReveal";

function renderCell(text: string) {
  const parts = text.split(/(`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={i}
          className="font-mono text-xs rounded bg-white/[0.08] border border-white/[0.12] px-1.5 py-0.5 text-cyan-300"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

export function ComparisonMatrix() {
  const { ref, isVisible } = useScrollReveal<HTMLElement>();

  return (
    <section
      ref={ref}
      id="comparison"
      className={`relative mb-48 scroll-mt-20 scroll-reveal ${isVisible ? "scroll-reveal-visible" : ""}`}
    >
      <div className="mx-auto max-w-6xl px-6">
        {/* Section Header */}
        <div className="mb-10 text-left">
          <h2 className="font-sansation mb-3 text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
            How Chadbox compares.
          </h2>
          <p className="max-w-2xl text-base sm:text-lg text-white/60 leading-relaxed">
            A side-by-side look at how our architecture stacks up against other code execution engines.
          </p>
        </div>

        {/* Matrix Table with Internal Dividing Lines (Matching UseCases Border Layout) */}
        <div className="relative overflow-x-auto rounded-3xl">
          {/* Ambient Glow Beam behind Chadbox column */}
          <div
            className="pointer-events-none absolute top-0 bottom-0 left-[19%] w-[27%] bg-cyan-400/[0.05] blur-xl"
            aria-hidden="true"
          />

          <table className="relative z-10 w-full min-w-[760px] table-fixed border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-white/[0.08]">
                <th className="p-4 sm:p-5 w-[19%] border-r border-white/[0.08]"></th>

                {/* Chadbox Column Header (Highlighted with Blue Glow) */}
                <th className="relative border-r border-white/[0.08] bg-cyan-400/10 p-4 sm:p-5 w-[27%] shadow-[inset_0_0_20px_rgba(56,189,248,0.08)]">
                  {/* Glowing Top Accent Line */}
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-500 via-cyan-300 to-cyan-500 shadow-[0_0_12px_rgba(56,189,248,0.9)]" />
                  <div className="flex items-center gap-2">
                    <span className="font-sansation text-base font-bold text-cyan-300 tracking-tight drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]">
                      Chadbox
                    </span>
                  </div>
                </th>

                <th className="p-4 sm:p-5 w-[27%] border-r border-white/[0.08] font-sansation text-base font-bold text-white/80 tracking-tight">
                  Piston
                </th>
                <th className="p-4 sm:p-5 w-[27%] font-sansation text-base font-bold text-white/80 tracking-tight">
                  Judge0
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.08]">
              {COMPARISON_ROWS.map((row, idx) => (
                <tr key={idx}>
                  <td className="p-4 sm:p-5 font-semibold text-white/90 align-top whitespace-nowrap border-r border-white/[0.08]">
                    {row.dimension}
                  </td>

                  {/* Chadbox Data Cell (Highlighted with Blue Glow) */}
                  <td className="border-r border-white/[0.08] bg-cyan-400/[0.035] p-4 sm:p-5 text-white font-medium leading-snug align-top shadow-[inset_0_0_20px_rgba(56,189,248,0.03)]">
                    <div>{renderCell(row.chadbox)}</div>
                    {row.chadboxSub && (
                      <div className="mt-1 text-xs text-white/50 leading-relaxed font-normal">
                        {renderCell(row.chadboxSub)}
                      </div>
                    )}
                  </td>

                  <td className="p-4 sm:p-5 text-white/50 leading-relaxed align-top border-r border-white/[0.08]">
                    {renderCell(row.piston)}
                  </td>
                  <td className="p-4 sm:p-5 text-white/50 leading-relaxed align-top">
                    {renderCell(row.judge0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Callout: Chadbox's Bet */}
        <div className="relative mt-8 overflow-hidden rounded-3xl bg-gradient-to-r from-cyan-500/[0.06] via-[#0c0f12]/80 to-emerald-500/[0.04] p-6 sm:p-8 backdrop-blur-md">
          <div className="pointer-events-none absolute -top-12 -left-12 h-32 w-32 rounded-full bg-cyan-400/10 blur-2xl" />

          <div className="relative z-10">
            <h3 className="font-sansation mb-2 text-base sm:text-lg font-bold tracking-tight text-cyan-300 drop-shadow-[0_0_8px_rgba(56,189,248,0.4)]">
              Chadbox&apos;s bet
            </h3>
            <p className="text-sm sm:text-base text-white/70 leading-relaxed max-w-4xl">
              You don&apos;t need a database, a message queue, or a cluster of worker containers to run code safely.{" "}
              <span className="text-white font-medium">
                You need a single container that knows how to talk to the Linux kernel.
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
