const DOMAIN_TLDS = "com|org|net|io|dev|co|app|ai|edu|gov|me|info|biz|us|uk|ca";
const NUMBER_SUFFIXES =
  "px|em|rem|vh|vw|pt|kg|lb|mi|km|ft|in|cm|mm|m|s|ms|hz|gb|mb|kb|tb";

// Normalize typographic apostrophes into straight apostrophes.
export function normalizeApostrophes(text: string): string {
  return text.replace(/['']/g, "'");
}

// Normalize raw tokens so counting/highlighting share the same lookup key.
export function normalizeTokenForSyntaxLookup(token: string): string {
  const normalized = normalizeApostrophes(token.toLowerCase().trim());
  if (!normalized) return "";

  // Trim boundary punctuation while preserving meaningful internals such as:
  // - contractions: don't
  // - URLs: example.com/path
  // - numbers: 1,000.5
  return normalized.replace(/^[^\p{L}\p{N}#]+|[^\p{L}\p{N}%#]+$/gu, "");
}

export const URL_MATCH_REGEX = new RegExp(
  `\\b(?:https?:\\/\\/|www\\.)\\S+|(?:[a-zA-Z0-9-]+\\.)+(?:${DOMAIN_TLDS})\\b`,
  "gi",
);

export const URL_TOKEN_REGEX = new RegExp(
  `^(?:https?:\\/\\/)\\S+$|^(?:www\\.)\\S+$|^(?:[a-zA-Z0-9-]+\\.)+(?:${DOMAIN_TLDS})(?:\\/\\S*)?$`,
  "i",
);

export const NUMBER_MATCH_REGEX = new RegExp(
  `\\b\\d+(?:[.,]\\d+)*(?:%|${NUMBER_SUFFIXES})?\\b`,
  "gi",
);

export const NUMBER_TOKEN_REGEX = new RegExp(
  `^\\d+(?:[.,]\\d+)*(?:%|${NUMBER_SUFFIXES})?$`,
  "i",
);

export const HASHTAG_MATCH_REGEX = /#[\p{L}\p{M}\p{N}_-]+/gu;
export const HASHTAG_TOKEN_REGEX = /^#[\p{L}\p{M}\p{N}_-]+$/u;

function extractUniqueLowercaseMatches(text: string, regex: RegExp): string[] {
  const matches = text.match(regex);
  if (!matches) return [];
  return Array.from(
    new Set(
      matches
        .map((match) => normalizeTokenForSyntaxLookup(match))
        .filter((match) => match.length > 0),
    ),
  );
}

export function extractUrls(text: string): string[] {
  return extractUniqueLowercaseMatches(text, URL_MATCH_REGEX);
}

export function extractNumbers(text: string): string[] {
  return extractUniqueLowercaseMatches(text, NUMBER_MATCH_REGEX);
}

export function extractHashtags(text: string): string[] {
  return extractUniqueLowercaseMatches(text, HASHTAG_MATCH_REGEX);
}

export function countPatternMatches(text: string, regex: RegExp): number {
  const matches = text.match(regex);
  return matches ? matches.length : 0;
}

export function isUrlToken(token: string): boolean {
  return URL_TOKEN_REGEX.test(token);
}

export function isNumberToken(token: string): boolean {
  return NUMBER_TOKEN_REGEX.test(token);
}

export function isHashtagToken(token: string): boolean {
  return HASHTAG_TOKEN_REGEX.test(token);
}
