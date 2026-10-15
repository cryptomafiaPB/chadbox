"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { RUNTIMES, RuntimeItem } from "@/data/runtimes";
import { useScrollReveal } from "@/lib/useScrollReveal";

import {
  SiNodedotjs,
  SiRust,
  SiGo,
  SiCplusplus,
  SiC,
  SiGnubash,
  SiTypescript,
  SiRuby,
} from "react-icons/si";
import { FaJava } from "react-icons/fa6";

// Official 2-Tone Python Vector Logo (from Python Software Foundation)
function OfficialPythonIcon() {
  return (
    <svg viewBox="0 0 110 110" className="h-7 w-7">
      <path
        fill="#3776AB"
        d="M54.5 5.5c-27.1 0-25.5 11.7-25.5 11.7l.1 12.1h26v3.7H17.7S5.5 31.6 5.5 58.7c0 27.1 10.6 26.1 10.6 26.1h6.3v-8.9s-.3-10.6 10.6-10.6h25.8s10.1-.2 10.1-9.8V31.6s1.5-12.8-24.4-12.8v-.1zm-13.8 8.1a4.2 4.2 0 1 1 0 8.4 4.2 4.2 0 0 1 0-8.4z"
      />
      <path
        fill="#FFD438"
        d="M55.5 104.5c27.1 0 25.5-11.7 25.5-11.7l-.1-12.1h-26v-3.7h37.4s12.2 1.4 12.2-25.7c0-27.1-10.6-26.1-10.6-26.1h-6.3v8.9s.3 10.6-10.6 10.6H51.2s-10.1.2-10.1 9.8v23.9s-1.5 12.8 24.4 12.8zm13.8-8.1a4.2 4.2 0 1 1 0-8.4 4.2 4.2 0 0 1 0 8.4z"
      />
    </svg>
  );
}

function LanguageBadge({ id }: { id: string }) {
  switch (id) {
    case "python":
      return (
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#131b24] border border-white/[0.08] shadow-md">
          <OfficialPythonIcon />
        </div>
      );
    case "nodejs":
      return (
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#131b24] border border-white/[0.08] shadow-md">
          <SiNodedotjs className="h-6 w-6 text-[#5FA04E]" />
        </div>
      );
    case "rust":
      return (
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#CE412B] border border-white/[0.08] shadow-md">
          <SiRust className="h-6 w-6 text-white" />
        </div>
      );
    case "java":
      return (
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#131b24] border border-white/[0.08] shadow-md">
          <FaJava className="h-6 w-6 text-[#E76F00]" />
        </div>
      );
    case "go":
      return (
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#00ADD8] border border-white/[0.08] shadow-md">
          <SiGo className="h-7 w-7 text-white" />
        </div>
      );
    case "cpp":
      return (
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#00599C] border border-white/[0.08] shadow-md">
          <SiCplusplus className="h-6 w-6 text-white" />
        </div>
      );
    case "c":
      return (
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#283593] border border-white/[0.08] shadow-md">
          <SiC className="h-6 w-6 text-white" />
        </div>
      );
    case "bash":
      return (
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#131b24] border border-white/[0.08] shadow-md">
          <SiGnubash className="h-6 w-6 text-white" />
        </div>
      );
    case "typescript":
      return (
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#3178C6] border border-white/[0.08] shadow-md">
          <SiTypescript className="h-6 w-6 text-white" />
        </div>
      );
    case "ruby":
      return (
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#CC342D] border border-white/[0.08] shadow-md">
          <SiRuby className="h-6 w-6 text-white" />
        </div>
      );
    default:
      return null;
  }
}

export function RuntimeGrid() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasMoreThanThreeRows, setHasMoreThanThreeRows] = useState(false);
  const [collapsedHeight, setCollapsedHeight] = useState<number | undefined>(undefined);
  const gridRef = useRef<HTMLDivElement>(null);
  const { ref: sectionRef, isVisible } = useScrollReveal<HTMLElement>();

  // Dynamically detect if grid exceeds 3 rows and calculate 3-row cutoff height
  useEffect(() => {
    const calculateGridRows = () => {
      if (!gridRef.current) return;
      const children = Array.from(gridRef.current.children) as HTMLElement[];
      if (children.length === 0) return;

      const rowTops: number[] = [];
      children.forEach((child) => {
        const top = child.offsetTop;
        if (!rowTops.includes(top)) {
          rowTops.push(top);
        }
      });

      // If there are more than 3 rows, determine height of first 3 rows
      if (rowTops.length > 3) {
        setHasMoreThanThreeRows(true);
        const gridTop = gridRef.current.offsetTop;
        const fourthRowTop = rowTops[3];
        setCollapsedHeight(fourthRowTop - gridTop);
      } else {
        setHasMoreThanThreeRows(false);
        setCollapsedHeight(undefined);
      }
    };

    calculateGridRows();
    window.addEventListener("resize", calculateGridRows);
    return () => window.removeEventListener("resize", calculateGridRows);
  }, []);

  return (
    <section
      ref={sectionRef}
      id="runtimes"
      className={`relative mb-48 scroll-mt-20 scroll-reveal ${isVisible ? "scroll-reveal-visible" : ""}`}
    >
      <div className="mx-auto max-w-6xl px-6">
        {/* Section Header (Matching previous section alignment & font specs) */}
        <div className="mb-10 text-left">
          <h2 className="font-sansation mb-3 text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
            Supported languages &amp; runtimes.
          </h2>
          <p className="max-w-2xl text-base sm:text-lg text-white/60 leading-relaxed">
            Pre-warmed, kernel-isolated execution across major compiled and interpreted languages. New languages and runtimes are actively being added.
          </p>
        </div>

        {/* Grid with Internal Dividing Lines (matching ComparisonMatrix and UseCases style) */}
        <div className="relative">
          <div
            ref={gridRef}
            style={{
              maxHeight: hasMoreThanThreeRows && !isExpanded && collapsedHeight ? `${collapsedHeight}px` : "none",
            }}
            className="overflow-hidden rounded-3xl grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 transition-[max-height] duration-500 ease-in-out"
          >
            {RUNTIMES.map((rt: RuntimeItem, idx: number) => {
              // Mobile (2 cols): 10 items -> rows: [0,1], [2,3], [4,5], [6,7], [8,9]. Last row: 8, 9.
              // SM (3 cols): 10 items -> rows: [0,1,2], [3,4,5], [6,7,8], [9]. Last row: 9.
              // MD (4 cols): 10 items -> rows: [0,1,2,3], [4,5,6,7], [8,9]. Last row: 8, 9.
              // LG (5 cols): 10 items -> rows: [0,1,2,3,4], [5,6,7,8,9]. Last row: 5,6,7,8,9.
              const isLastRowMobile = idx >= 8;
              const isLastRowSM = idx >= 9;
              const isLastRowMD = idx >= 8;
              const isLastRowLG = idx >= 5;

              const isLastColMobile = (idx + 1) % 2 === 0;
              const isLastColSM = (idx + 1) % 3 === 0;
              const isLastColMD = (idx + 1) % 4 === 0;
              const isLastColLG = (idx + 1) % 5 === 0;

              return (
                <div
                  key={rt.id}
                  className={`group relative flex flex-col items-center justify-between p-6 sm:p-7 text-center min-h-[160px] border-white/[0.08] ${
                    isLastColMobile ? "border-r-0" : "border-r"
                  } ${
                    isLastColSM ? "sm:border-r-0" : "sm:border-r"
                  } ${
                    isLastColMD ? "md:border-r-0" : "md:border-r"
                  } ${
                    isLastColLG ? "lg:border-r-0" : "lg:border-r"
                  } ${
                    isLastRowMobile ? "border-b-0" : "border-b"
                  } ${
                    isLastRowSM ? "sm:border-b-0" : "sm:border-b"
                  } ${
                    isLastRowMD ? "md:border-b-0" : "md:border-b"
                  } ${
                    isLastRowLG ? "lg:border-b-0" : "lg:border-b"
                  }`}
                >
                  {/* Centered Logo & Language Info */}
                  <div className="flex flex-col items-center justify-center my-auto">
                    <div className="flex items-center justify-center mb-3">
                      <LanguageBadge id={rt.id} />
                    </div>
                    <h3 className="font-sansation text-sm sm:text-base font-bold text-white tracking-tight">
                      {rt.name}
                    </h3>
                    <div className="mt-1 font-mono text-xs text-white/40">
                      {rt.version}
                    </div>
                  </div>

                  {/* Subtext Tag: Compiled vs Interpreted */}
                  <div className="mt-3">
                    <span className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.02] px-2.5 py-0.5 text-[10px] font-mono text-white/50">
                      {rt.compiled ? "Compiled" : "Interpreted"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Fade Gradient for 3rd row cutoff */}
          {hasMoreThanThreeRows && !isExpanded && (
            <div
              className="pointer-events-none absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-[#0B0D0E] via-[#0B0D0E]/80 to-transparent z-10 rounded-b-3xl"
              aria-hidden="true"
            />
          )}
        </div>

        {/* Expand / Collapse Button (Only shown when content exceeds 3 rows) */}
        {hasMoreThanThreeRows && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="group inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.04] px-5 py-2 text-xs font-mono font-medium text-white/80 hover:text-white hover:border-cyan-400/40 hover:bg-cyan-400/[0.06] transition-all cursor-pointer shadow-lg"
            >
              <span>{isExpanded ? "Hide" : "Show all"}</span>
              {isExpanded ? (
                <ChevronUp className="h-3.5 w-3.5 text-cyan-400 transition-transform group-hover:-translate-y-0.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-cyan-400 transition-transform group-hover:translate-y-0.5" />
              )}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
