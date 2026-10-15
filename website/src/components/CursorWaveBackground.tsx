"use client";

import React, { useEffect, useRef } from "react";

interface WaveRipple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  speed: number;
  color: string;
}

export function CursorWaveBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // Respect user's preference for reduced motion or touch devices
    if (
      typeof window === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("matchMedia" in window && window.matchMedia("(pointer: fine)").matches)
    ) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const ripples: WaveRipple[] = [];
    const colors = [
      "0, 245, 155",   // neon mint
      "56, 189, 248",  // cyan
      "16, 185, 129",  // emerald accent
    ];

    let lastX = -1;
    let lastY = -1;
    let lastTime = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const now = performance.now();
      const x = e.clientX;
      const y = e.clientY;

      const dist = Math.hypot(x - lastX, y - lastY);

      // Create a smooth ripple wave when moving
      if (dist > 16 && now - lastTime > 40) {
        lastTime = now;
        lastX = x;
        lastY = y;

        // Choose a subtle brand color
        const color = colors[ripples.length % colors.length];

        ripples.push({
          x,
          y,
          radius: 10,
          maxRadius: Math.min(140, 60 + dist * 1.5),
          alpha: 0.18,
          speed: 1.8 + Math.min(dist * 0.04, 1.6),
          color,
        });

        // Cap ripple array to prevent unnecessary rendering load
        if (ripples.length > 25) {
          ripples.shift();
        }
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.radius += r.speed;

        // Decay alpha as radius expands toward maxRadius
        const progress = r.radius / r.maxRadius;
        const currentAlpha = Math.max(0, r.alpha * (1 - progress));

        if (progress >= 1 || currentAlpha <= 0.005) {
          ripples.splice(i, 1);
          continue;
        }

        // 1. Soft radial wave fill
        const gradient = ctx.createRadialGradient(
          r.x,
          r.y,
          Math.max(0, r.radius - 28),
          r.x,
          r.y,
          r.radius
        );
        gradient.addColorStop(0, `rgba(${r.color}, 0)`);
        gradient.addColorStop(0.65, `rgba(${r.color}, ${currentAlpha * 0.4})`);
        gradient.addColorStop(0.9, `rgba(${r.color}, ${currentAlpha * 0.85})`);
        gradient.addColorStop(1, `rgba(${r.color}, 0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.fill();

        // 2. Delicate wave crest ring
        ctx.strokeStyle = `rgba(${r.color}, ${currentAlpha * 0.9})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.stroke();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
    />
  );
}
