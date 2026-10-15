"use client";

import React, { useState } from "react";
import { Terminal, Cloud, Copy, Check } from "lucide-react";
import { copyToClipboard } from "@/lib/utils";
import { useToast } from "./Toast";
import { useScrollReveal } from "@/lib/useScrollReveal";

type UsageMode = "self-hosted" | "cloud-api";
type CloudTab = "curl" | "python";

export function UsageGuide() {
  const [selectedMode, setSelectedMode] = useState<UsageMode>("cloud-api");
  const [cloudTab, setCloudTab] = useState<CloudTab>("curl");
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();
  const { ref, isVisible } = useScrollReveal<HTMLElement>();

  const dockerCommands = `git clone https://github.com/cryptomafiaPB/chadbox.git
cd chadbox
docker compose up -d --build`;

  const curlCommand = `curl -X POST https://api.chadbox.io/v1/execute \\
  -H "Authorization: Bearer cb_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "language": "python",
    "files": [
      { "name": "main.py", "content": "print(\\"Isolated untrusted execution!\\")" }
    ]
  }'`;

  const pythonCode = `from chadbox import Chadbox

# Initialize client with your API key
cb = Chadbox(api_key="cb_live_...")

# Run untrusted multi-file code in sub-50ms sandbox
execution = cb.execute(
    language="python",
    files=[
        {"name": "main.py", "content": "print('Isolated untrusted execution!')"}
    ]
)

print(execution.stdout)`;

  const currentCode =
    selectedMode === "cloud-api"
      ? cloudTab === "curl"
        ? curlCommand
        : pythonCode
      : dockerCommands;

  const handleCopy = async () => {
    const success = await copyToClipboard(currentCode);
    if (success) {
      setCopied(true);
      showToast(
        selectedMode === "cloud-api"
          ? "Code snippet copied to clipboard"
          : "Docker commands copied to clipboard"
      );
      setTimeout(() => setCopied(false), 2200);
    }
  };

  return (
    <section
      ref={ref}
      id="usage-guide"
      className={`relative mb-48 scroll-mt-20 scroll-reveal ${isVisible ? "scroll-reveal-visible" : ""}`}
    >
      {/* Section Header */}
      <div className="mb-10 text-left">
        {/* Title */}
        <h2 className="font-sansation mb-3 text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
          Two Paths. Zero Friction.
        </h2>

        {/* Short Description */}
        <p className="max-w-2xl text-base sm:text-lg text-white/60 leading-relaxed">
          Execute payloads instantly in our isolated cloud via the API, or install and run the software locally on your own machine.
        </p>
      </div>

      {/* 2-Column Split: Left Options & Right Terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
        
        {/* ===================================================================
            LEFT COLUMN: Two stacked selectable parts (locked height, no jumping)
        ==================================================================== */}
        <div className="lg:col-span-4 flex flex-col justify-center">
          <div className="flex flex-col h-full rounded-tl-2xl rounded-bl-2xl rounded-tr-none rounded-br-none bg-[#0c0f12]/60 divide-y divide-white/[0.08] overflow-hidden">
            
            {/* PART 1: Cloud API (1st path: use Chadbox API to share code, everything runs on the cloud) */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => setSelectedMode("cloud-api")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  setSelectedMode("cloud-api");
                }
              }}
              className={`flex-1 flex flex-col justify-center group text-left p-6 sm:p-7 rounded-tl-2xl rounded-tr-none rounded-b-none transition-all duration-200 cursor-pointer ${
                selectedMode === "cloud-api"
                  ? "bg-white/[0.04]"
                  : "bg-transparent hover:bg-white/[0.02]"
              }`}
            >
              <div className="flex items-center gap-3.5 mb-2.5">
                <Cloud
                  className={`h-5 w-5 transition-colors ${
                    selectedMode === "cloud-api"
                      ? "text-cyan-400"
                      : "text-white/60 group-hover:text-white/80"
                  }`}
                />
                <h3
                  className={`font-sansation text-lg sm:text-xl tracking-tight transition-colors ${
                    selectedMode === "cloud-api"
                      ? "font-bold text-white"
                      : "font-semibold text-white/70 group-hover:text-white"
                  }`}
                >
                  Cloud API Service
                </h3>
              </div>
              <p className="text-sm text-white/50 leading-relaxed pl-8.5">
                Send your code to Chadbox&apos;s API. Everything executes safely in our isolated cloud with zero local setup.
              </p>
            </div>

            {/* PART 2: Local Installation (2nd path: install software locally on user's end and use it there) */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => setSelectedMode("self-hosted")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  setSelectedMode("self-hosted");
                }
              }}
              className={`flex-1 flex flex-col justify-center group text-left p-6 sm:p-7 rounded-bl-2xl rounded-br-none rounded-t-none transition-all duration-200 cursor-pointer ${
                selectedMode === "self-hosted"
                  ? "bg-white/[0.04]"
                  : "bg-transparent hover:bg-white/[0.02]"
              }`}
            >
              <div className="flex items-center gap-3.5 mb-2.5">
                <Terminal
                  className={`h-5 w-5 transition-colors ${
                    selectedMode === "self-hosted"
                      ? "text-emerald-terminal"
                      : "text-white/60 group-hover:text-white/80"
                  }`}
                />
                <h3
                  className={`font-sansation text-lg sm:text-xl tracking-tight transition-colors ${
                    selectedMode === "self-hosted"
                      ? "font-bold text-white"
                      : "font-semibold text-white/70 group-hover:text-white"
                  }`}
                >
                  Local Installation
                </h3>
              </div>
              <p className="text-sm text-white/50 leading-relaxed pl-8.5">
                Install and run the software locally on your own machine or private servers using Docker Compose.
              </p>
            </div>

          </div>
        </div>

        {/* ===================================================================
            RIGHT COLUMN: Sleek Code / Terminal Window (fixed height to prevent layout shift)
        ==================================================================== */}
        <div className="lg:col-span-8 flex flex-col">
          <div className="h-[430px] sm:h-[440px] rounded-2xl border border-white/[0.08] bg-[#07090b] shadow-2xl overflow-hidden flex flex-col justify-between">
            
            {/* Terminal Window Header */}
            <div className="flex items-center justify-between border-b border-white/[0.06] bg-[#0d1013] px-5 py-3.5 shrink-0">
              {/* macOS Traffic Light Dots */}
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[#ff5f56]" />
                <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
                <span className="h-3 w-3 rounded-full bg-[#27c93f]" />
                <span className="ml-3 font-mono text-xs text-white/40">
                  {selectedMode === "self-hosted" ? "bash — docker-compose" : cloudTab === "curl" ? "bash — curl" : "python3 — sdk"}
                </span>
              </div>

              {/* Language Switcher for Cloud API & Copy Action */}
              <div className="flex items-center gap-3">
                {selectedMode === "cloud-api" && (
                  <div className="flex items-center rounded-lg border border-white/10 bg-white/[0.04] p-0.5">
                    <button
                      onClick={() => setCloudTab("curl")}
                      className={`px-2.5 py-1 font-mono text-xs rounded transition-all ${
                        cloudTab === "curl"
                          ? "bg-cyan-400/20 text-cyan-300 font-medium shadow-sm"
                          : "text-white/50 hover:text-white"
                      }`}
                    >
                      cURL
                    </button>
                    <button
                      onClick={() => setCloudTab("python")}
                      className={`px-2.5 py-1 font-mono text-xs rounded transition-all ${
                        cloudTab === "python"
                          ? "bg-cyan-400/20 text-cyan-300 font-medium shadow-sm"
                          : "text-white/50 hover:text-white"
                      }`}
                    >
                      Python
                    </button>
                  </div>
                )}

                {/* Copy Button */}
                <button
                  onClick={handleCopy}
                  title="Copy to clipboard"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-white/70 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-mint-neon" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Code / Command Display Area */}
            <div className="p-6 sm:p-7 font-mono text-xs sm:text-sm leading-relaxed overflow-x-auto overflow-y-auto flex-1 flex flex-col justify-center transition-opacity duration-200">
              {selectedMode === "self-hosted" ? (
                /* Terminal commands for Docker Compose */
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-terminal/80 select-none font-bold text-sm">$</span>
                    <span>
                      <span className="text-cyan-400 font-medium">git</span>{" "}
                      <span className="text-white/90">clone</span>{" "}
                      <span className="text-emerald-300">https://github.com/cryptomafiaPB/chadbox.git</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-emerald-terminal/80 select-none font-bold text-sm">$</span>
                    <span>
                      <span className="text-cyan-400 font-medium">cd</span>{" "}
                      <span className="text-white/90">chadbox</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-emerald-terminal/80 select-none font-bold text-sm">$</span>
                    <span>
                      <span className="text-cyan-400 font-medium">docker</span>{" "}
                      <span className="text-white/90">compose</span>{" "}
                      <span className="text-yellow-300">up</span>{" "}
                      <span className="text-purple-300">-d</span>{" "}
                      <span className="text-purple-300">--build</span>
                    </span>
                    <span className="inline-block w-2 h-4 bg-emerald-terminal ml-1 animate-terminal-cursor" aria-hidden="true" />
                  </div>
                </div>
              ) : cloudTab === "curl" ? (
                /* cURL API Request */
                <pre className="text-white/90 whitespace-pre overflow-x-auto">
                  <span className="text-cyan-400 font-medium">curl</span> -X POST https://api.chadbox.io/v1/execute \{"\n"}
                  {"  "}-H <span className="text-emerald-300">&quot;Authorization: Bearer cb_live_...&quot;</span> \{"\n"}
                  {"  "}-H <span className="text-emerald-300">&quot;Content-Type: application/json&quot;</span> \{"\n"}
                  {"  "}-d <span className="text-yellow-300">&apos;{"{"}</span>{"\n"}
                  {"    "}<span className="text-cyan-300">&quot;language&quot;</span>: <span className="text-emerald-300">&quot;python&quot;</span>,{"\n"}
                  {"    "}<span className="text-cyan-300">&quot;files&quot;</span>: [{"\n"}
                  {"      "}<span className="text-cyan-300">&quot;name&quot;</span>: <span className="text-emerald-300">&quot;main.py&quot;</span>,{"\n"}
                  {"      "}<span className="text-cyan-300">&quot;content&quot;</span>: <span className="text-emerald-300">&quot;print(\&quot;Isolated untrusted execution!\&quot;)&quot;</span>{"\n"}
                  {"    "}]{"\n"}
                  {"  "}<span className="text-yellow-300">{"}"}&apos;</span>{"\n"}
                  <span className="inline-block w-2 h-3.5 bg-cyan-400 align-middle animate-terminal-cursor" aria-hidden="true" />
                </pre>
              ) : (
                /* Python SDK */
                <pre className="text-white/90 whitespace-pre overflow-x-auto">
                  <span className="text-purple-400 font-medium">from</span> chadbox <span className="text-purple-400 font-medium">import</span> Chadbox{"\n\n"}
                  <span className="text-white/40"># Initialize client with your API key</span>{"\n"}
                  cb = Chadbox(api_key=<span className="text-emerald-300">&quot;cb_live_...&quot;</span>){"\n\n"}
                  <span className="text-white/40"># Run untrusted multi-file code in sub-50ms sandbox</span>{"\n"}
                  execution = cb.execute({"\n"}
                  {"    "}language=<span className="text-emerald-300">&quot;python&quot;</span>,{"\n"}
                  {"    "}files=[{"\n"}
                  {"        "}&#123;<span className="text-emerald-300">&quot;name&quot;</span>: <span className="text-emerald-300">&quot;main.py&quot;</span>, <span className="text-emerald-300">&quot;content&quot;</span>: <span className="text-emerald-300">&quot;print(&apos;Isolated untrusted execution!&apos;)&quot;</span>&#125;{"\n"}
                  {"    "}]{"\n"}
                  ){"\n\n"}
                  <span className="text-cyan-400">print</span>(execution.stdout){"\n"}
                  <span className="inline-block w-2 h-3.5 bg-emerald-terminal align-middle animate-terminal-cursor" aria-hidden="true" />
                </pre>
              )}
            </div>

            {/* Bottom Status Bar */}
            <div className="flex items-center justify-between border-t border-white/[0.04] bg-[#0a0d0f] px-5 py-2.5 font-mono text-[11px] text-white/40 shrink-0">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-mint-neon animate-pulse" />
                <span>{selectedMode === "self-hosted" ? "Kernel cgroups v2 enabled" : "Sub-50ms global cold-start"}</span>
              </div>
              <span>{selectedMode === "self-hosted" ? "Localhost :8080" : "api.chadbox.io"}</span>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
