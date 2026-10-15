"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

interface NavbarProps {
  onOpenApiKeyModal?: () => void;
}

export function Navbar({ onOpenApiKeyModal }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Fade in background when scrolling down past 80px as navbar approaches/overlaps title
      if (window.scrollY > 80) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-300 ${
        isScrolled || mobileMenuOpen
          ? "border-b border-white/[0.08] bg-canvas/80 backdrop-blur-md shadow-lg shadow-black/20"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        {/* Brand: Only logo with name */}
        <div className="flex items-center">
          <Link href="#hero" className="flex items-center gap-2.5 font-sansation text-lg font-bold lowercase text-text-primary tracking-tight">
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
        </div>

        {/* Desktop Links */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="#usage-guide" className="text-sm font-medium text-text-muted hover:text-text-primary transition-colors">
            How to use
          </Link>
          <Link href="#pricing" className="text-sm font-medium text-text-muted hover:text-text-primary transition-colors">
            Pricing
          </Link>
          <Link href="#faq" className="text-sm font-medium text-text-muted hover:text-text-primary transition-colors">
            FAQs
          </Link>
        </nav>

        {/* Mobile menu toggle */}
        <div className="flex items-center md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-md border border-subtle p-1.5 text-text-muted hover:text-text-primary"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="border-b border-white/[0.06] bg-canvas/90 backdrop-blur-lg px-6 py-4 md:hidden flex flex-col gap-3">
          <Link
            href="#usage-guide"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-medium text-text-muted hover:text-text-primary py-1"
          >
            How to use
          </Link>
          <Link
            href="#pricing"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-medium text-text-muted hover:text-text-primary py-1"
          >
            Pricing
          </Link>
          <Link
            href="#faq"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-medium text-text-muted hover:text-text-primary py-1"
          >
            FAQs
          </Link>
        </div>
      )}
    </header>
  );
}
