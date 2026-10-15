"use client";

import React, { useEffect, useRef } from "react";

interface Node {
  baseX: number;
  baseY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  colorType: "mint" | "cyan" | "white";
}

export function ConstellationField() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // Respect user's preference for reduced motion
    if (
      typeof window === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;

    const resize = () => {
      if (!canvas) return;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener("resize", resize);

    // Mouse coordinates (interpolated for natural elastic pull)
    let mouseX = -9999;
    let mouseY = -9999;
    let targetMouseX = -9999;
    let targetMouseY = -9999;
    let isMouseActive = false;

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
      if (!isMouseActive) {
        mouseX = targetMouseX;
        mouseY = targetMouseY;
        isMouseActive = true;
      }
    };

    const handleMouseLeave = () => {
      isMouseActive = false;
      targetMouseX = -9999;
      targetMouseY = -9999;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);

    // Initialize starry constellation nodes based on screen real estate
    const nodeCount = Math.floor(Math.min(95, Math.max(45, (width * height) / 18000)));
    const nodes: Node[] = [];

    const colorTypes: ("mint" | "cyan" | "white")[] = [
      "mint",
      "cyan",
      "white",
      "mint",
      "white",
    ];

    for (let i = 0; i < nodeCount; i++) {
      const rx = Math.random() * width;
      const ry = Math.random() * height;
      nodes.push({
        baseX: rx,
        baseY: ry,
        x: rx,
        y: ry,
        // Gentle, slow ambient cosmic drift
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        size: Math.random() > 0.8 ? 2 : Math.random() > 0.3 ? 1.5 : 1.2,
        alpha: 0.25 + Math.random() * 0.45,
        colorType: colorTypes[Math.floor(Math.random() * colorTypes.length)],
      });
    }

    // Config parameters
    const CONNECTION_DIST = 115; // Max distance to connect two nodes with an ultra-thin line
    const MOUSE_RADIUS = 175; // Magnetic field radius around the cursor
    const MAGNETIC_STRENGTH = 0.09; // Gentle magnetic attraction towards cursor
    const RETURN_SPRING = 0.04; // Spring back toward natural drifting trajectory

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Smooth mouse follow
      if (isMouseActive) {
        mouseX += (targetMouseX - mouseX) * 0.15;
        mouseY += (targetMouseY - mouseY) * 0.15;
      } else {
        mouseX += (-9999 - mouseX) * 0.05;
        mouseY += (-9999 - mouseY) * 0.05;
      }

      // 1. Update positions & apply magnetic pull
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];

        // Ambient drift
        node.baseX += node.vx;
        node.baseY += node.vy;

        // Wrap around viewport edges seamlessly
        if (node.baseX < -20) node.baseX = width + 20;
        else if (node.baseX > width + 20) node.baseX = -20;
        if (node.baseY < -20) node.baseY = height + 20;
        else if (node.baseY > height + 20) node.baseY = -20;

        // Magnetic interaction with cursor
        const dx = mouseX - node.x;
        const dy = mouseY - node.y;
        const dist = Math.hypot(dx, dy);

        if (dist < MOUSE_RADIUS && isMouseActive) {
          // Attract towards cursor: stronger closer, smoothly fading off at radius edge
          const force = (1 - dist / MOUSE_RADIUS) * (1 - dist / MOUSE_RADIUS);
          const angle = Math.atan2(dy, dx);
          
          // Pull target towards cursor
          const pullX = Math.cos(angle) * (force * (dist * 0.45));
          const pullY = Math.sin(angle) * (force * (dist * 0.45));

          node.x += (node.baseX + pullX - node.x) * MAGNETIC_STRENGTH;
          node.y += (node.baseY + pullY - node.y) * MAGNETIC_STRENGTH;
        } else {
          // Return gently to base trajectory
          node.x += (node.baseX - node.x) * RETURN_SPRING;
          node.y += (node.baseY - node.y) * RETURN_SPRING;
        }
      }

      // 2. Draw ultra-thin, low-opacity connecting constellation lines between nearby nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const n1 = nodes[i];
          const n2 = nodes[j];
          const d = Math.hypot(n1.x - n2.x, n1.y - n2.y);

          if (d < CONNECTION_DIST) {
            // Lower opacity for longer distance, very subtle
            const lineAlpha = (1 - d / CONNECTION_DIST) * 0.14;

            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.strokeStyle = `rgba(0, 245, 155, ${lineAlpha})`;
            ctx.lineWidth = 0.65;
            ctx.stroke();
          }
        }

        // Also draw ultra-subtle magnetic connection line from cursor to nearby nodes
        if (isMouseActive) {
          const dCursor = Math.hypot(mouseX - nodes[i].x, mouseY - nodes[i].y);
          if (dCursor < MOUSE_RADIUS) {
            const cursorLineAlpha = (1 - dCursor / MOUSE_RADIUS) * 0.22;
            ctx.beginPath();
            ctx.moveTo(mouseX, mouseY);
            ctx.lineTo(nodes[i].x, nodes[i].y);
            ctx.strokeStyle = `rgba(56, 189, 248, ${cursorLineAlpha})`;
            ctx.lineWidth = 0.75;
            ctx.stroke();
          }
        }
      }

      // 3. Draw tiny floating nodes
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        
        // Proximity to cursor enhances brightness subtly
        let currentAlpha = node.alpha;
        let currentSize = node.size;

        if (isMouseActive) {
          const dist = Math.hypot(mouseX - node.x, mouseY - node.y);
          if (dist < MOUSE_RADIUS) {
            const prox = 1 - dist / MOUSE_RADIUS;
            currentAlpha = Math.min(1, node.alpha + prox * 0.5);
            currentSize = node.size + prox * 0.8;
          }
        }

        if (node.colorType === "mint") {
          ctx.fillStyle = `rgba(0, 245, 155, ${currentAlpha})`;
        } else if (node.colorType === "cyan") {
          ctx.fillStyle = `rgba(56, 189, 248, ${currentAlpha})`;
        } else {
          ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha * 0.85})`;
        }

        // Draw crisp round star node
        ctx.beginPath();
        ctx.arc(node.x, node.y, currentSize, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
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
