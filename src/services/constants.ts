export const MAX_ITERATIONS = 3;
export const MAX_SEARCH_RESULTS = 3;
export const MAX_CONTENT_CHARS = 10000;
export const MAX_RETRY_ATTEMPTS = 3;
export const RETRY_DELAY_MS = 20000;

export const OPENAI_MODELS = {
  PLANNING: "gpt-4o-mini",
  EXTRACTION: "gpt-4o-mini",
  ANALYSIS: "gpt-4o-mini",
  REPORT: "gpt-4o-mini"
};

export const GOOGLE_MODELS = {
  PLANNING: "gemini-1.5-flash",
  EXTRACTION: "gemini-2.0-flash",
  ANALYSIS: "gemini-2.0-flash",
  REPORT: "gemini-2.0-flash"
};

export const HYBRID_MODELS = {
  PLANNING: "gemini-2.0-flash",
  EXTRACTION: "gpt-4o-mini",
  ANALYSIS: "gpt-4o-mini",
  REPORT: "gpt-4o-mini"
};