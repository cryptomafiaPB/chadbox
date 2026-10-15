"use client";

import React, { useEffect, useRef } from "react";

interface HeroGridBoxProps {
  heroRef: React.RefObject<HTMLElement>;
}

export function HeroGridBox({ heroRef }: HeroGridBoxProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    let animationFrameId: number;

    const animate = () => {
      const rect = hero.getBoundingClientRect();
      const heroWidth = rect.width;
      const heroHeight = rect.height;

      // Serene, smooth pacing for floating motion
      const time = performance.now() * 0.0006;

      // Multi-harmonic gentle drift in random 2D curves
      const wanderX = Math.sin(time * 0.8) * 60 + Math.cos(time * 1.4) * 35;
      const wanderY = Math.cos(time * 0.9) * 45 + Math.sin(time * 1.2) * 25;

      // Base anchor position on the right side of the hero
      const baseX = heroWidth * 0.70;
      const baseY = Math.min(heroHeight * 0.38, 300);

      const targetX = baseX + wanderX;
      const targetY = baseY + wanderY;

      if (containerRef.current) {
        const gridW = 640;
        const gridH = 480;
        const x = targetX - gridW / 2;
        const y = targetY - gridH / 2;
        containerRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [heroRef]);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute top-0 left-0 z-0 will-change-transform"
      style={{
        width: 640,
        height: 480,
      }}
      aria-hidden="true"
    >
      <svg
        width="640"
        height="480"
        viewBox="0 0 640 480"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          {/* Rounded Grid Pattern */}
          <pattern
            id="hero-grid-tiles"
            width="44"
            height="44"
            patternUnits="userSpaceOnUse"
          >
            <rect
              x="2"
              y="2"
              width="40"
              height="40"
              rx="5"
              ry="5"
              fill="rgba(16, 185, 129, 0.025)"
              stroke="rgba(16, 185, 129, 0.26)"
              strokeWidth="1"
            />
          </pattern>

          {/* Radial Glow in Center of Gridbox */}
          <radialGradient
            id="hero-grid-glow"
            cx="50%"
            cy="50%"
            r="50%"
          >
            <stop offset="0%" stopColor="#00F59B" stopOpacity="0.16" />
            <stop offset="35%" stopColor="#10B981" stopOpacity="0.08" />
            <stop offset="75%" stopColor="#10B981" stopOpacity="0" />
          </radialGradient>

          {/* Soft Edge Fade Mask */}
          <mask id="hero-grid-edge-fade">
            <radialGradient
              id="hero-grid-mask-grad"
              cx="50%"
              cy="50%"
              r="50%"
            >
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="32%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="58%" stopColor="#ffffff" stopOpacity="0.45" />
              <stop offset="82%" stopColor="#ffffff" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>
            <rect width="100%" height="100%" fill="url(#hero-grid-mask-grad)" />
          </mask>
        </defs>

        {/* Ambient Glow Center */}
        <rect
          width="100%"
          height="100%"
          fill="url(#hero-grid-glow)"
          mask="url(#hero-grid-edge-fade)"
        />

        {/* The Gridbox of Rounded Tiles */}
        <rect
          width="100%"
          height="100%"
          fill="url(#hero-grid-tiles)"
          mask="url(#hero-grid-edge-fade)"
        />
      </svg>
    </div>
  );
}
