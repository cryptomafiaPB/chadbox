import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/Toast";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Chadbox",
  description:
    "Ultra-fast, hyper-secure untrusted code execution sandbox engine. Run Python, Node, Go, Rust, C++ in sub-45ms using direct Linux cgroups and SquashFS mounts.",
  keywords: [
    "code execution",
    "sandbox",
    "cgroup v2",
    "seccomp",
    "squashfs",
    "llm runtime",
    "untrusted code",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${inter.variable}`}>
      <body className={inter.className}>
        <ToastProvider>
          {/* Background Elements */}
          <div className="ambient-glow ambient-glow-pricing" aria-hidden="true" />

          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
