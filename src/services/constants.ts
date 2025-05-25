export const MAX_ITERATIONS = 3;
export const MAX_SEARCH_RESULTS = 3;
export const MAX_CONTENT_CHARS = 10000;
export const MAX_RETRY_ATTEMPTS = 3;
export const RETRY_DELAY_MS = 20000;

export const GROQ_MODELS = {
  PLANNING: "llama-3.1-8b-instant",
  EXTRACTION: "llama-3.1-8b-instant",
  ANALYSIS: "llama-3.1-8b-instant",
  REPORT: "llama-3.1-8b-instant"
};

export const OPENAI_MODELS = {
  PLANNING: "gpt-4o",
  EXTRACTION: "gpt-4o",
  ANALYSIS: "gpt-4o",
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