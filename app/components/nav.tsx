import Link from "next/link";
import { Github } from "lucide-react";

export function Nav() {
  return (
    <header className="border-b border-brand-border bg-brand-bg/60 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 text-brand-text">
          <span className="font-mono text-brand-accent">◆</span>
          <span className="text-sm font-semibold tracking-tight">
            org-intelligence-redesigner
          </span>
        </Link>
        <nav className="flex items-center gap-6 text-sm text-brand-muted">
          <Link href="/framework" className="hover:text-brand-text">
            Framework
          </Link>
          <Link href="/input" className="hover:text-brand-text">
            Analyse
          </Link>
          <a
            href="https://github.com/techpolicycomms/org-redesign"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 hover:text-brand-text"
          >
            <Github className="h-4 w-4" />
            GitHub
          </a>
        </nav>
      </div>
    </header>
  );
}
