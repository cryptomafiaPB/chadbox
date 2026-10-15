"use client";

import React, { useEffect, useRef } from "react";

interface FluidParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  maxAlpha: number;
  hue: number; // 155 to 195 (mint green to cyan)
  decay: number;
}

export function FluidCursorCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // Respect reduced motion & touch-only devices
    if (
      typeof window === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("matchMedia" in window && window.matchMedia("(pointer: fine)").matches)
    ) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animId: number;
    let width = 0;
    let height = 0;

    // Lower internal resolution for high-performance organic blending
    const scale = 0.5; // Render at 50% scale for velvety fluid blur without GPU strain

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * scale);
      canvas.height = Math.floor(height * scale);
    };

    resize();
    window.addEventListener("resize", resize);

    const particles: FluidParticle[] = [];
    let lastX = -1;
    let lastY = -1;
    let lastTime = performance.now();

    const handleMouseMove = (e: MouseEvent) => {
      const now = performance.now();
      const dt = Math.max(1, now - lastTime);
      lastTime = now;

      const currentX = e.clientX * scale;
      const currentY = e.clientY * scale;

      if (lastX === -1) {
        lastX = currentX;
        lastY = currentY;
        return;
      }

      const dx = currentX - lastX;
      const dy = currentY - lastY;
      const dist = Math.hypot(dx, dy);
      const speed = dist / dt;

      // Spawn fluid splats along the cursor vector
      if (dist > 3) {
        const steps = Math.min(6, Math.max(1, Math.floor(dist / 8)));
        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          const interpX = lastX + dx * t;
          const interpY = lastY + dy * t;

          // Subtle natural jitter
          const spread = 8 * scale;
          const px = interpX + (Math.random() - 0.5) * spread;
          const py = interpY + (Math.random() - 0.5) * spread;

          // Low viscosity fluid smoke: drift gently in the direction of cursor motion
          const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.8;
          const driftSpeed = Math.min(speed * 0.25, 2.5) * (0.5 + Math.random() * 0.5);

          // Color varies between brand mint (#00F59B -> hue ~158) and cyan (#38BDF8 -> hue ~198)
          const hue = 158 + Math.random() * 40;

          particles.push({
            x: px,
            y: py,
            vx: Math.cos(angle) * driftSpeed,
            vy: Math.sin(angle) * driftSpeed,
            radius: (28 + Math.random() * 22) * scale,
            alpha: 0.16 + Math.min(speed * 0.05, 0.12), // Gentle, low-contrast sheen
            maxAlpha: 0.28,
            hue,
            decay: 0.024 + Math.random() * 0.018, // Fades out fast (under 600ms)
          });
        }
      }

      lastX = currentX;
      lastY = currentY;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    const render = () => {
      // Clear canvas frame
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Liquid smoke blending: 'screen' or 'lighter' creates silky fluid luminescence
      ctx.globalCompositeOperation = "screen";

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.alpha -= p.decay;
        p.x += p.vx;
        p.y += p.vy;
        p.radius *= 1.025; // Gentle expanding fluid dissipation
        p.vx *= 0.94; // Low-viscosity drag
        p.vy *= 0.94;

        if (p.alpha <= 0.005) {
          particles.splice(i, 1);
          continue;
        }

        // Soft radial water/smoke drop
        const gradient = ctx.createRadialGradient(
          p.x,
          p.y,
          0,
          p.x,
          p.y,
          p.radius
        );

        const currentAlpha = Math.min(p.alpha, p.maxAlpha);
        gradient.addColorStop(0, `hsla(${p.hue}, 95%, 55%, ${currentAlpha})`);
        gradient.addColorStop(0.5, `hsla(${p.hue}, 90%, 50%, ${currentAlpha * 0.4})`);
        gradient.addColorStop(1, `hsla(${p.hue}, 85%, 45%, 0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 h-full w-full opacity-70 blur-[18px] mix-blend-screen transition-opacity"
      style={{ willChange: "transform" }}
    />
  );
}
