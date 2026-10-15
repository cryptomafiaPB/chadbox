"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { FAQS } from "@/data/faqs";
import { useScrollReveal } from "@/lib/useScrollReveal";

export function Faq() {
  const [openId, setOpenId] = useState<string | null>("escape-prevention");
  const { ref, isVisible } = useScrollReveal<HTMLElement>();

  return (
    <section
      ref={ref}
      id="faq"
      className={`relative mb-48 scroll-mt-20 scroll-reveal ${isVisible ? "scroll-reveal-visible" : ""}`}
    >
      <div id="faqs" className="sr-only" />
      <div className="mx-auto max-w-6xl px-6">
        {/* Section Header */}
        <div className="mb-10 text-left">
          <h2 className="font-sansation mb-3 text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
            FAQs.
          </h2>
          <p className="max-w-2xl text-base sm:text-lg text-white/60 leading-relaxed">
            Details on kernel boundaries, memory quotas, network enforcement, and security architecture.
          </p>
        </div>

        {/* Accordion List */}
        <div className="max-w-3xl space-y-3">
          {FAQS.map((faq) => {
            const isOpen = openId === faq.id;

            return (
              <div
                key={faq.id}
                onClick={() => {
                  if (isOpen) {
                    setOpenId(null);
                  }
                }}
                className={`overflow-hidden rounded-xl border bg-surface transition-colors ${
                  isOpen ? "border-emerald-accent/30 cursor-pointer" : "border-subtle"
                }`}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    if (isOpen) {
                      e.stopPropagation();
                      setOpenId(null);
                    } else {
                      setOpenId(faq.id);
                    }
                  }}
                  className="group flex w-full items-center justify-between p-5 text-left text-base font-semibold text-text-primary hover:text-emerald-terminal transition-colors"
                >
                  <span>{faq.question}</span>
                  {isOpen ? (
                    <ChevronUp className="h-5 w-5 text-emerald-terminal shrink-0" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-white/50 group-hover:text-emerald-terminal transition-colors shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-sm text-text-muted leading-relaxed border-t border-white/[0.03] cursor-pointer">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
