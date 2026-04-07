import type { Metadata } from "next";
import { Nav } from "@/components/nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "org-intelligence-redesigner",
  description:
    "Redesign your org for the intelligence era. Turn hierarchy into capabilities, world models, and DRIs.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-brand-bg text-brand-text antialiased">
        <Nav />
        <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
        <footer className="mx-auto max-w-6xl px-6 py-10 text-xs text-brand-muted">
          Based on Block&rsquo;s{" "}
          <a
            className="underline hover:text-brand-text"
            href="https://block.xyz/inside/from-hierarchy-to-intelligence"
            target="_blank"
            rel="noreferrer"
          >
            From Hierarchy to Intelligence
          </a>
          .
        </footer>
      </body>
    </html>
  );
}
