"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { ComparisonMatrix } from "@/components/ComparisonMatrix";
import { RuntimeGrid } from "@/components/RuntimeGrid";
import { Pricing } from "@/components/Pricing";
import { Faq } from "@/components/Faq";
import { Footer } from "@/components/Footer";
import { ApiKeyModal } from "@/components/ApiKeyModal";
import { useCursorGlow } from "@/lib/useCursorGlow";
import { ConstellationField } from "@/components/ConstellationField";

export default function Home() {
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  // Activate dynamic mouse-proximity lighting across cards
  useCursorGlow();

  const handleOpenApiKeyModal = () => {
    setIsApiKeyModalOpen(true);
  };

  const handleCloseApiKeyModal = () => {
    setIsApiKeyModalOpen(false);
  };

  return (
    <div className="relative min-h-screen overflow-x-clip">
      {/* Constellation / Point Cloud Field with magnetic cursor pull */}
      <ConstellationField />

      {/* Top-Left Ambient Illumination over Navbar & Hero, cleanly faded before Dual Product Ecosystem */}
      <div className="hero-illumination-container" aria-hidden="true">
        <div className="hero-illumination" />
        <div className="hero-illumination-core" />
      </div>

      {/* Sticky Navigation */}
      <Navbar onOpenApiKeyModal={handleOpenApiKeyModal} />

      <main className="relative z-10">
        {/* 1. Hero Section (includes DualProductSplit, UsageGuide, UseCases) */}
        <Hero onOpenApiKeyModal={handleOpenApiKeyModal} />

        {/* 2. Comparison with Other Engines */}
        <ComparisonMatrix />

        {/* 3. Ecosystem & Runtime Grid */}
        <RuntimeGrid />

        {/* 8. Tiered Pricing Model */}
        <Pricing onOpenApiKeyModal={handleOpenApiKeyModal} />

        {/* 9. Technical FAQ & Support */}
        <Faq />
      </main>

      {/* 10. Minimalist Dark Footer */}
      <Footer />

      {/* Interactive API Key Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={handleCloseApiKeyModal}
      />
    </div>
  );
}
