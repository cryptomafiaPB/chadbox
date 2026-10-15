"use client";

import React, { useState } from "react";
import { Check } from "lucide-react";
import { PRICING_TIERS } from "@/data/pricing";
import { useScrollReveal } from "@/lib/useScrollReveal";

interface PricingProps {
  onOpenApiKeyModal: () => void;
}

export function Pricing({ onOpenApiKeyModal }: PricingProps) {
  const [isAnnual, setIsAnnual] = useState(true);
  const { ref, isVisible } = useScrollReveal<HTMLElement>();

  return (
    <section
      ref={ref}
      id="pricing"
      className={`relative mb-48 scroll-mt-20 scroll-reveal ${isVisible ? "scroll-reveal-visible" : ""}`}
    >
      <div className="mx-auto max-w-6xl px-6">
        {/* Section Header */}
        <div className="mb-10 text-left">
          <h2 className="font-sansation mb-3 text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
            Transparent pricing.
          </h2>
          <p className="max-w-2xl text-base sm:text-lg text-white/60 leading-relaxed">
            A monetization strategy built on community growth and elastic limits rather than rigid paywalls.
          </p>
        </div>

        {/* Toggle Switch */}
        <div className="mb-10 flex flex-wrap items-center gap-3.5">
          <button
            type="button"
            onClick={() => setIsAnnual(true)}
            className={`text-sm cursor-pointer transition-colors duration-200 ${
              isAnnual ? "text-white font-medium" : "text-white/50 hover:text-white/80"
            }`}
          >
            Annual billing
          </button>
          <span
            aria-disabled={!isAnnual}
            className={`inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[11px] tracking-tight transition-all duration-200 select-none ${
              isAnnual
                ? "border border-mint-neon/30 bg-mint-neon/10 text-mint-neon shadow-sm shadow-mint-neon/20 opacity-100"
                : "border border-white/10 bg-white/[0.04] text-white/30 opacity-40 cursor-not-allowed"
            }`}
          >
            Save 20%
          </span>
          <button
            type="button"
            onClick={() => setIsAnnual((prev) => !prev)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-accent/50 ${
              isAnnual
                ? "bg-emerald-accent border-mint-neon/40"
                : "bg-white/[0.08] border-white/15"
            }`}
            role="switch"
            aria-checked={isAnnual}
            aria-label="Toggle between annual and monthly billing"
          >
            <span
              aria-hidden="true"
              className={`pointer-events-none inline-block h-5 w-5 rounded-full shadow-sm transition-transform duration-200 ease-in-out ${
                isAnnual
                  ? "translate-x-[2px] bg-[#07150f]"
                  : "translate-x-[22px] bg-white"
              }`}
            />
          </button>
          <button
            type="button"
            onClick={() => setIsAnnual(false)}
            className={`text-sm cursor-pointer transition-colors duration-200 ${
              !isAnnual ? "text-white font-medium" : "text-white/50 hover:text-white/80"
            }`}
          >
            Monthly billing
          </button>
        </div>

        {/* 3 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch pt-4">
          {PRICING_TIERS.map((tier) => {
            const price = isAnnual ? tier.priceAnnual : tier.priceMonthly;
            const period = isAnnual ? tier.periodAnnual : tier.periodMonthly;

            return (
              <div
                key={tier.id}
                className={`glow-card relative flex flex-col p-8 rounded-2xl border bg-surface transition-all !overflow-visible ${
                  tier.featured
                    ? "border-emerald-accent/50 bg-[#161a1d] shadow-2xl shadow-emerald-accent/15"
                    : "border-subtle"
                }`}
              >
                {tier.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 rounded-full bg-gradient-to-r from-emerald-accent to-mint-neon px-3 py-0.5 font-mono text-[11px] font-semibold lowercase text-[#07150f] shadow-md shadow-mint-neon/20 whitespace-nowrap">
                    most popular
                  </span>
                )}

                <h3 className="mb-2 text-xl font-bold text-text-primary">{tier.name}</h3>
                <p className="mb-6 min-h-[40px] text-xs text-text-muted leading-relaxed">
                  {tier.description}
                </p>

                <div className="mb-8 flex items-baseline gap-1.5">
                  <span className="text-4xl font-extrabold tracking-tight text-text-primary">
                    {price}
                  </span>
                  <span className="text-xs text-text-dim">{period}</span>
                </div>

                <ul className="mb-8 space-y-3 text-xs text-text-muted">
                  {tier.features.map((feat, i) => (
                    <li key={i} className="flex items-center gap-2.5">
                      <Check className="h-4 w-4 text-emerald-accent shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto">
                  {tier.ctaAction === "github" ? (
                    <a
                      href="https://github.com/chadbox/chadbox"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full text-center rounded-full border border-subtle bg-surface/70 py-2.5 text-xs font-semibold text-text-primary hover:bg-surface-elevated transition-colors"
                    >
                      {tier.ctaText}
                    </a>
                  ) : tier.featured ? (
                    <button
                      onClick={onOpenApiKeyModal}
                      className="w-full rounded-full bg-gradient-to-r from-emerald-accent to-mint-neon py-2.5 text-xs font-semibold text-[#07150f] shadow-lg shadow-mint-neon/20 hover:scale-[1.01] transition-transform"
                    >
                      {tier.ctaText}
                    </button>
                  ) : (
                    <button
                      onClick={onOpenApiKeyModal}
                      className="w-full rounded-full border border-subtle bg-surface/70 py-2.5 text-xs font-semibold text-text-primary hover:bg-surface-elevated transition-colors"
                    >
                      {tier.ctaText}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
