export type PromptContext = Record<
  string,
  string | number | boolean | null | undefined
>;

/**
 * Tiny template interpolator for {{PLACEHOLDER}} variables.
 * - Unknown keys are left as-is
 * - Null/undefined become an empty string
 */
export function interpolatePrompt(template: string, ctx: PromptContext): string {
  return template.replace(/\{\{\s*([A-Z0-9_]+)\s*\}\}/g, (match, key) => {
    if (!(key in ctx)) return match;
    const value = ctx[key];
    if (value === null || value === undefined) return "";
    return String(value);
  });
}

export const DEFAULT_PROMPT_CONTEXT: PromptContext = {
  APP_NAME: "AgencIA",
  LOCALE: "es-AR",
  DEFAULT_COUNTRY_CODE: "",
  DEFAULT_COUNTRY_NAME: "",
};
