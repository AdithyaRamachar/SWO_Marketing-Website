/**
 * Pure (no Node, no DOM) parser for src/styles/tokens.css. Shared by the Node
 * scripts and tests and by the browser showcase, so nothing keeps a second copy
 * of the token list.
 */

/** Strip comments, then collect every `--name: value;` declaration in order. */
export function parseTokenDeclarations(css: string): Map<string, string> {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const tokens = new Map<string, string>();
  const declaration = /(--[a-z0-9-]+\*?)\s*:\s*([^;]+);/gi;
  for (const match of withoutComments.matchAll(declaration)) {
    const name = match[1] as string;
    const value = (match[2] as string).trim();
    // `--color-*: initial` resets a Tailwind namespace; it is not a token.
    if (name.endsWith('*')) continue;
    tokens.set(name, value);
  }
  return tokens;
}
