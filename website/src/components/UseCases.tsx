"use client";

import React from "react";
import { Bot, Code2, ShieldCheck, Workflow } from "lucide-react";
import { useScrollReveal } from "@/lib/useScrollReveal";

export function UseCases() {
  const { ref, isVisible } = useScrollReveal<HTMLElement>();

  const cases = [
    {
      id: "ai-agents",
      icon: Bot,
      title: "AI Agents & Code Interpreters",
      persona: "For AI Agent Developers",
      description:
        "Run model-generated code safely in ephemeral sandboxes that boot and destroy in milliseconds.",
      accentColor: "text-cyan-400",
      borderClasses: "border-b md:border-r border-white/[0.08]",
    },
    {
      id: "coding-platforms",
      icon: Code2,
      title: "Online Coding Platforms",
      persona: "For EdTech & Coding Platforms",
      description:
        "Power browser playgrounds and interactive coding platforms with sub-50ms cold starts.",
      accentColor: "text-emerald-terminal",
      borderClasses: "border-b border-white/[0.08]",
    },
    {
      id: "assessments",
      icon: ShieldCheck,
      title: "Interview & Assessment Systems",
      persona: "For Technical Hiring Platforms",
      description:
        "Benchmark candidate submissions with microsecond CPU accounting and strict memory limits.",
      accentColor: "text-emerald-terminal",
      borderClasses: "border-b md:border-b-0 md:border-r border-white/[0.08]",
    },
    {
      id: "ci-pipelines",
      icon: Workflow,
      title: "CI Pipelines & Plugin Isolation",
      persona: "For Indie Hackers & CI Engineers",
      description:
        "Isolate untrusted build scripts and third-party plugins with zero host network exposure.",
      accentColor: "text-cyan-400",
      borderClasses: "",
    },
  ];

  return (
    <section
      ref={ref}
      id="use-cases"
      className={`scroll-reveal ${isVisible ? "scroll-reveal-visible" : ""}`}
    >
      {/* Section Header */}
      <div className="mb-10 text-left">
        {/* Title */}
        <h2 className="font-sansation mb-3 text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
          Where Chadbox fits in your stack.
        </h2>

        {/* Short Description */}
        <p className="max-w-2xl text-base sm:text-lg text-white/60 leading-relaxed">
          Fast, kernel-isolated execution for code you cannot trust.
        </p>
      </div>

      {/* 2x2 Unified Split Box Container (Matching Dual-Product Ecosystem design) */}
      <div className="overflow-hidden rounded-3xl">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {cases.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className={`flex flex-col justify-between p-8 sm:p-10 ${item.borderClasses}`}
              >
                <div>
                  {/* Icon */}
                  <div className="mb-6 flex items-center">
                    <Icon className={`h-10 w-10 ${item.accentColor}`} strokeWidth={1.5} />
                  </div>

                  {/* Title */}
                  <h3 className="font-sansation mb-2 text-lg sm:text-xl font-bold tracking-tight text-white leading-tight">
                    {item.title}
                  </h3>

                  {/* Persona */}
                  <div className="font-mono text-xs text-white/40 mb-3">
                    ({item.persona})
                  </div>

                  {/* Description */}
                  <p className="text-sm text-white/50 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
