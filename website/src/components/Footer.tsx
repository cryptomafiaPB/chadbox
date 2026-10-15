"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Send, Check } from "lucide-react";
import { useToast } from "./Toast";

export function Footer() {
  const [email, setEmail] = useState("");
  const [question, setQuestion] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !question.trim()) {
      showToast("Please provide both your email and your note.");
      return;
    }
    setSubmitted(true);
    showToast("Question submitted! We'll reply to your email shortly.");
  };

  return (
    <footer className="relative border-t border-subtle bg-[#090B0C] pt-16 pb-12">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col lg:flex-row items-start justify-between gap-10 pb-12">
          {/* Brand */}
          <div className="max-w-md">
            <Link href="#hero" className="flex items-center gap-2.5 font-sansation text-lg font-bold lowercase text-text-primary tracking-tight mb-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="chadbox"
                width={14}
                height={20}
                className="h-5 w-auto object-contain shrink-0"
              />
              <span>chadbox</span>
            </Link>
            <p className="text-xs text-text-muted leading-relaxed">
              Zero-overhead, hyper-secure untrusted code execution engine. Open-source core with a globally distributed managed cloud API.
            </p>
          </div>

          {/* Contact for questions */}
          <div className="w-full max-w-md">
            <h3 className="text-sm font-semibold text-text-primary mb-1">
              Contact for questions
            </h3>
            <p className="text-xs text-text-muted mb-3.5 leading-relaxed">
              Have a question? Send us a note directly.
            </p>

            {submitted ? (
              <div className="flex items-center gap-2.5 rounded-xl border border-emerald-accent/30 bg-emerald-accent/10 p-4 text-xs text-emerald-terminal">
                <Check className="h-4 w-4 shrink-0" />
                <span>Message received! We&apos;ll get back to your email shortly.</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-2.5">
                <div>
                  <input
                    type="email"
                    required
                    aria-required="true"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email address *"
                    className="w-full rounded-lg border border-subtle bg-surface/90 px-3.5 py-2 text-xs text-text-primary placeholder:text-text-dim focus:border-emerald-accent/50 focus:outline-none focus:ring-1 focus:ring-emerald-accent/30 transition-all"
                  />
                </div>
                <div>
                  <textarea
                    required
                    aria-required="true"
                    rows={3}
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Type your question or note here *"
                    className="w-full resize-none rounded-lg border border-subtle bg-surface/90 px-3.5 py-2 text-xs text-text-primary placeholder:text-text-dim focus:border-emerald-accent/50 focus:outline-none focus:ring-1 focus:ring-emerald-accent/30 transition-all"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-accent to-mint-neon px-4 py-2 text-xs font-semibold text-[#07150f] shadow-md shadow-mint-neon/20 hover:scale-[1.02] transition-transform cursor-pointer"
                  >
                    <span>Send question</span>
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        <div className="border-t border-subtle pt-8 text-xs text-text-dim">
          <span>&copy; 2026 Chadbox</span>
        </div>
      </div>
    </footer>
  );
}
