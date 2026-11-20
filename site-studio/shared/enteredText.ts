import { z } from "zod";

// Entered text: a value someone or something typed, wrapped with where it came from (AD-22).
// Declared now so that /api/v1/ never changes shape when a route first uses it. No route uses it yet.

export const ENTERED_TEXT_SOURCES = ["member", "agent", "reviewer_link", "import", "file_name", "pdf_text"] as const;

export const enteredTextSource = z.enum(ENTERED_TEXT_SOURCES);

export const enteredText = z
  .object({
    value: z.string().max(100_000),
    source: enteredTextSource,
    /** Where the value came from: an account, token, reviewer link, file or page reference. */
    ref: z.string().min(1).max(200),
  })
  .strict();

export type EnteredTextSource = z.infer<typeof enteredTextSource>;
export type EnteredText = z.infer<typeof enteredText>;
