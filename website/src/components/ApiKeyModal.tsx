"use client";

import React, { useState, useEffect } from "react";
import { X, Copy, Check } from "lucide-react";
import { copyToClipboard } from "@/lib/utils";
import { useToast } from "./Toast";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ApiKeyModal({ isOpen, onClose }: ApiKeyModalProps) {
  const [token, setToken] = useState("");
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(8)))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      setToken(`cb_live_${randomHex}`);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setCopied(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    const success = await copyToClipboard(token);
    if (success) {
      setCopied(true);
      showToast("API token copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl border border-subtle bg-[#131618] p-8 shadow-2xl shadow-emerald-accent/10"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-text-dim hover:text-text-primary transition-colors"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-3 flex items-center gap-2.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint-neon opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-accent"></span>
          </span>
          <span className="font-mono text-xs uppercase tracking-wider text-emerald-terminal">
            Instant Access
          </span>
        </div>

        <h3 className="mb-2 text-xl font-bold text-text-primary">Generate Test API Key</h3>
        <p className="mb-6 text-sm text-text-muted">
          Get an immediate sandbox key loaded with 500 free test executions. No credit card required.
        </p>

        {/* Token box */}
        <div className="mb-4 overflow-hidden rounded-lg border border-subtle bg-surface-code">
          <div className="flex items-center justify-between border-b border-subtle bg-[#101316] px-3.5 py-2 font-mono text-xs text-text-dim">
            <span>YOUR LIVE API TOKEN</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-text-muted hover:text-text-primary transition-colors"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-mint-neon" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? "Copied!" : "Copy Key"}</span>
            </button>
          </div>
          <pre className="p-3.5 font-mono text-sm font-semibold text-mint-neon">{token}</pre>
        </div>

        {/* Curl snippet */}
        <div className="mb-6 overflow-hidden rounded-lg border border-subtle bg-surface-code">
          <div className="border-b border-subtle bg-[#101316] px-3.5 py-2 font-mono text-xs text-text-dim">
            <span>QUICK CURL VERIFICATION</span>
          </div>
          <pre className="overflow-x-auto p-3.5 font-mono text-xs text-text-muted">
{`curl -X POST https://api.chadbox.io/v1/execute \\
  -H "Authorization: Bearer ${token}" \\
  -H "Content-Type: application/json" \\
  -d '{"language":"python","files":[{"name":"main.py","content":"print(1+1)"}]}'`}
          </pre>
        </div>

        <button
          onClick={onClose}
          className="w-full rounded-full bg-gradient-to-r from-emerald-accent to-mint-neon py-2.5 text-sm font-semibold text-[#07150f] shadow-lg shadow-mint-neon/20 hover:scale-[1.01] transition-transform"
        >
          Done &amp; Explore API Docs
        </button>
      </div>
    </div>
  );
}
