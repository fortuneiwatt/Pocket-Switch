import { createHighlighter, type Highlighter } from "shiki";

let highlighterPromise: Promise<Highlighter> | null = null;

/**
 * Shiki's highlighter instance is expensive to create (loads grammars + theme),
 * so we create it once and reuse it across every highlight() call.
 */
function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ["github-dark"],
      langs: ["javascript", "python", "bash", "typescript"],
    });
  }
  return highlighterPromise;
}

export async function highlightCode(
  code: string,
  lang: string
): Promise<string> {
  const highlighter = await getHighlighter();
  const safeLang = ["javascript", "python", "bash", "typescript"].includes(
    lang
  )
    ? lang
    : "javascript";
  return highlighter.codeToHtml(code, {
    lang: safeLang,
    theme: "github-dark",
  });
}
