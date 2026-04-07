import fs from "node:fs/promises";
import path from "node:path";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export const dynamic = "force-static";

async function loadMarkdown(file: string): Promise<string> {
  // docs/ lives at the repo root, one level above /app.
  const docPath = path.join(process.cwd(), "..", "docs", file);
  try {
    return await fs.readFile(docPath, "utf8");
  } catch {
    return "# Framework docs not found\n\nCould not read `docs/framework.md`.";
  }
}

export default async function FrameworkPage() {
  const framework = await loadMarkdown("framework.md");
  const mapping = await loadMarkdown("mapping-guide.md");

  return (
    <div className="space-y-16">
      <article className="prose prose-invert max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{framework}</ReactMarkdown>
      </article>
      <article className="prose prose-invert max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{mapping}</ReactMarkdown>
      </article>
    </div>
  );
}
