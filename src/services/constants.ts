export const MAX_ITERATIONS = 3;
export const MAX_SEARCH_RESULTS = 3;
export const MAX_CONTENT_CHARS = 10000;
export const MAX_RETRY_ATTEMPTS = 3;
export const RETRY_DELAY_MS = 1000;

export const OPENROUTER_MODELS = {
  PLANNING: "google/gemini-flash-1.5-8b-exp",
  EXTRACTION: "google/gemini-flash-1.5-8b-exp",
  ANALYSIS: "google/gemini-flash-1.5-8b-exp",
  REPORT: "google/gemini-flash-1.5-8b-exp"
};

export const OPENAI_MODELS = {
  PLANNING: "gpt-4o-mini",
  EXTRACTION: "gpt-4o-mini",
  ANALYSIS: "gpt-4o-mini",
  REPORT: "gpt-4o"
};

export const GOOGLE_MODELS = {
  PLANNING: "gemini-1.5-flash",
  EXTRACTION: "gemini-1.5-flash",
  ANALYSIS: "gemini-1.5-flash",
  REPORT: "gemini-1.5-flash"
};

export const HYBRID_MODELS = {
  PLANNING: "gemini-1.5-flash",
  EXTRACTION: "gpt-4o-mini",
  ANALYSIS: "gpt-4o-mini",
  REPORT: "gpt-4o"
};