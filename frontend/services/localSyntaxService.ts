import nlp from "compromise";
import { SyntaxAnalysis, SyntaxSets } from "@/types";
import {
  HASHTAG_MATCH_REGEX,
  URL_MATCH_REGEX,
  countPatternMatches,
  extractHashtags,
  extractNumbers,
  extractUrls,
  isHashtagToken,
  isNumberToken,
  normalizeApostrophes,
  normalizeTokenForSyntaxLookup,
} from "@/utils/syntaxPatterns";

/**
 * Centralized word counting function with UTF-8 support.
 * Handles CJK (Chinese, Japanese, Korean) characters and emoji properly.
 * - For Latin/Western text: counts whitespace-separated words
 * - For CJK characters: counts each character as a word (since CJK doesn't use spaces)
 * - For emoji: counts each emoji as a word
 */
export function countWords(content: string): number {
  if (!content.trim()) return 0;

  // Try to use Intl.Segmenter for proper word segmentation (modern browsers)
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    try {
      const segmenter = new Intl.Segmenter(undefined, { granularity: "word" });
      const segments = Array.from(segmenter.segment(content.trim()));
      // Count only segments that are actual words (not whitespace/punctuation)
      return segments.filter((segment) => segment.isWordLike).length;
    } catch {
      // Fall back to manual counting if Segmenter fails
    }
  }

  // Fallback: Manual word counting with CJK and emoji support
  const text = content.trim();
  let count = 0;

  // Regex patterns
  // CJK characters (Chinese, Japanese Kanji, Korean Hanja)
  const cjkPattern = /[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF]/g;
  // Japanese Hiragana and Katakana
  const japaneseKanaPattern = /[\u3040-\u309F\u30A0-\u30FF]/g;
  // Korean Hangul
  const koreanPattern = /[\uAC00-\uD7AF\u1100-\u11FF]/g;
  // Emoji (simplified pattern covering common emoji ranges)
  const emojiPattern =
    /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;

  // Count CJK characters (each character = 1 word)
  const cjkMatches = text.match(cjkPattern) || [];
  count += cjkMatches.length;

  // Count Japanese kana (each character = 1 word, though this is approximate)
  const kanaMatches = text.match(japaneseKanaPattern) || [];
  count += kanaMatches.length;

  // Count Korean characters
  const koreanMatches = text.match(koreanPattern) || [];
  count += koreanMatches.length;

  // Count emoji
  const emojiMatches = text.match(emojiPattern) || [];
  count += emojiMatches.length;

  // Remove CJK, Japanese, Korean, and emoji from text before counting Western words
  const westernText = text
    .replace(cjkPattern, " ")
    .replace(japaneseKanaPattern, " ")
    .replace(koreanPattern, " ")
    .replace(emojiPattern, " ")
    .trim();

  // Count Western words (whitespace-separated)
  if (westernText) {
    const westernWords = westernText
      .split(/\s+/)
      .filter((word) => word.length > 0);
    count += westernWords.length;
  }

  return count;
}

/**
 * Get word type counts from syntax analysis.
 * Uses the array lengths from analyzed syntax data for accurate type counts.
 */
export function getWordTypeCounts(
  syntaxData: SyntaxAnalysis,
): Record<string, number> {
  return {
    nouns: syntaxData.nouns.length,
    verbs: syntaxData.verbs.length,
    adjectives: syntaxData.adjectives.length,
    adverbs: syntaxData.adverbs.length,
    pronouns: syntaxData.pronouns.length,
    prepositions: syntaxData.prepositions.length,
    conjunctions: syntaxData.conjunctions.length,
    articles: syntaxData.articles.length,
    interjections: syntaxData.interjections.length,
    urls: syntaxData.urls.length,
    numbers: syntaxData.numbers.length,
    hashtags: syntaxData.hashtags.length,
  };
}

/**
 * Count word type occurrences in content using syntax sets for O(1) lookup.
 * Unlike getWordTypeCounts which counts unique types, this counts every
 * occurrence so that sum(type_counts) reflects actual word usage.
 */
export function getWordTypeOccurrences(
  content: string,
  syntaxSets: SyntaxSets,
): Record<string, number> {
  const counts: Record<string, number> = {
    nouns: 0,
    verbs: 0,
    adjectives: 0,
    adverbs: 0,
    pronouns: 0,
    prepositions: 0,
    conjunctions: 0,
    articles: 0,
    interjections: 0,
    urls: 0,
    numbers: 0,
    hashtags: 0,
  };

  if (!content.trim()) return counts;

  // First pass: count URL/hashtag occurrences directly from content (they span multiple tokens)
  counts.urls = countPatternMatches(content, URL_MATCH_REGEX);
  counts.hashtags = countPatternMatches(content, HASHTAG_MATCH_REGEX);

  // Tokenize using whitespace split to keep URL-like tokens intact,
  // then normalize punctuation/case for stable matching.
  const normalizedTokens = content
    .trim()
    .split(/\s+/)
    .map((token) => normalizeTokenForSyntaxLookup(token))
    .filter((token) => token.length > 0);

  // Build a set of URL tokens for exclusion from other categories
  const urlTokenSet = new Set<string>(extractUrls(content));

  // Classify each word occurrence using O(1) Set lookups
  // Skip tokens that are part of URLs
  for (const word of normalizedTokens) {
    if (urlTokenSet.has(word)) {
      continue; // Already counted as URL
    } else if (isHashtagToken(word)) {
      continue; // Already counted as hashtag
    } else if (syntaxSets.numbers.has(word) || isNumberToken(word)) {
      counts.numbers++;
    } else if (syntaxSets.articles.has(word)) {
      counts.articles++;
    } else if (syntaxSets.interjections.has(word)) {
      counts.interjections++;
    } else if (syntaxSets.prepositions.has(word)) {
      counts.prepositions++;
    } else if (syntaxSets.conjunctions.has(word)) {
      counts.conjunctions++;
    } else if (syntaxSets.pronouns.has(word)) {
      counts.pronouns++;
    } else if (syntaxSets.nouns.has(word)) {
      counts.nouns++;
    } else if (syntaxSets.verbs.has(word)) {
      counts.verbs++;
    } else if (syntaxSets.adjectives.has(word)) {
      counts.adjectives++;
    } else if (syntaxSets.adverbs.has(word)) {
      counts.adverbs++;
    }
  }

  return counts;
}

// Static lists for high accuracy word detection
const ARTICLES = ["a", "an", "the"];

const PREPOSITIONS = [
  "in",
  "on",
  "at",
  "to",
  "for",
  "with",
  "by",
  "from",
  "up",
  "about",
  "into",
  "over",
  "after",
  "under",
  "between",
  "through",
  "during",
  "before",
  "behind",
  "above",
  "below",
  "across",
  "against",
  "along",
  "among",
  "around",
  "beside",
  "beyond",
  "despite",
  "down",
  "except",
  "inside",
  "near",
  "off",
  "onto",
  "outside",
  "past",
  "since",
  "toward",
  "towards",
  "underneath",
  "until",
  "upon",
  "within",
  "without",
];

const INTERJECTIONS = [
  "wow",
  "oh",
  "ah",
  "oops",
  "ouch",
  "yay",
  "hey",
  "hmm",
  "ugh",
  "phew",
  "alas",
  "bravo",
  "hurray",
  "hooray",
  "yikes",
  "ooh",
  "aha",
  "ahem",
  "aww",
  "bah",
  "boo",
  "duh",
  "eek",
  "gee",
  "geez",
  "gosh",
  "ha",
  "haha",
  "huh",
  "hurrah",
  "jeez",
  "meh",
  "nah",
  "nope",
  "okay",
  "ok",
  "ow",
  "psst",
  "shh",
  "shush",
  "tsk",
  "uh",
  "um",
  "whoa",
  "whoops",
  "yep",
  "yes",
  "yeah",
  "yup",
  "yo",
  "hello",
];

// Comprehensive contraction map for proper categorization
// The primary type is used for highlighting (first in the types array)
const CONTRACTIONS: Record<string, { types: (keyof SyntaxAnalysis)[] }> = {
  // Pronoun + verb (be)
  "i'm": { types: ["pronouns", "verbs"] },
  "you're": { types: ["pronouns", "verbs"] },
  "he's": { types: ["pronouns", "verbs"] },
  "she's": { types: ["pronouns", "verbs"] },
  "it's": { types: ["pronouns", "verbs"] },
  "we're": { types: ["pronouns", "verbs"] },
  "they're": { types: ["pronouns", "verbs"] },

  // Pronoun + have
  "i've": { types: ["pronouns", "verbs"] },
  "you've": { types: ["pronouns", "verbs"] },
  "we've": { types: ["pronouns", "verbs"] },
  "they've": { types: ["pronouns", "verbs"] },

  // Pronoun + will
  "i'll": { types: ["pronouns", "verbs"] },
  "you'll": { types: ["pronouns", "verbs"] },
  "he'll": { types: ["pronouns", "verbs"] },
  "she'll": { types: ["pronouns", "verbs"] },
  "it'll": { types: ["pronouns", "verbs"] },
  "we'll": { types: ["pronouns", "verbs"] },
  "they'll": { types: ["pronouns", "verbs"] },

  // Pronoun + would/had
  "i'd": { types: ["pronouns", "verbs"] },
  "you'd": { types: ["pronouns", "verbs"] },
  "he'd": { types: ["pronouns", "verbs"] },
  "she'd": { types: ["pronouns", "verbs"] },
  "it'd": { types: ["pronouns", "verbs"] },
  "we'd": { types: ["pronouns", "verbs"] },
  "they'd": { types: ["pronouns", "verbs"] },

  // Interrogative/demonstrative + verb
  "where's": { types: ["adverbs", "verbs"] },
  "what's": { types: ["pronouns", "verbs"] },
  "who's": { types: ["pronouns", "verbs"] },
  "that's": { types: ["pronouns", "verbs"] },
  "there's": { types: ["adverbs", "verbs"] },
  "here's": { types: ["adverbs", "verbs"] },
  "how's": { types: ["adverbs", "verbs"] },
  "when's": { types: ["adverbs", "verbs"] },
  "why's": { types: ["adverbs", "verbs"] },

  // Let's (special case - verb + pronoun)
  "let's": { types: ["verbs", "pronouns"] },

  // Negative contractions (verb + not)
  "don't": { types: ["verbs", "adverbs"] },
  "doesn't": { types: ["verbs", "adverbs"] },
  "didn't": { types: ["verbs", "adverbs"] },
  "won't": { types: ["verbs", "adverbs"] },
  "wouldn't": { types: ["verbs", "adverbs"] },
  "can't": { types: ["verbs", "adverbs"] },
  "couldn't": { types: ["verbs", "adverbs"] },
  "shouldn't": { types: ["verbs", "adverbs"] },
  "isn't": { types: ["verbs", "adverbs"] },
  "aren't": { types: ["verbs", "adverbs"] },
  "wasn't": { types: ["verbs", "adverbs"] },
  "weren't": { types: ["verbs", "adverbs"] },
  "hasn't": { types: ["verbs", "adverbs"] },
  "haven't": { types: ["verbs", "adverbs"] },
  "hadn't": { types: ["verbs", "adverbs"] },
  "mustn't": { types: ["verbs", "adverbs"] },
  "needn't": { types: ["verbs", "adverbs"] },
  "shan't": { types: ["verbs", "adverbs"] },
  "mightn't": { types: ["verbs", "adverbs"] },
  "ain't": { types: ["verbs", "adverbs"] },
};

// Extract contractions from text and add to appropriate categories
function extractContractions(text: string, result: SyntaxAnalysis): void {
  const normalizedText = normalizeApostrophes(text.toLowerCase());

  for (const [contraction, info] of Object.entries(CONTRACTIONS)) {
    // Create regex that matches word boundaries and handles both straight and curly apostrophes
    const escapedContraction = contraction.replace("'", "['']");
    const regex = new RegExp(`\\b${escapedContraction}\\b`, "gi");

    if (regex.test(normalizedText)) {
      // Add the contraction to its primary category (first in types array)
      const primaryType = info.types[0];
      if (!result[primaryType].includes(contraction)) {
        result[primaryType].push(contraction);
      }
    }
  }
}

export const analyzeSyntax = async (text: string): Promise<SyntaxAnalysis> => {
  if (!text.trim()) {
    return {
      nouns: [],
      pronouns: [],
      verbs: [],
      adjectives: [],
      adverbs: [],
      prepositions: [],
      conjunctions: [],
      articles: [],
      interjections: [],
      urls: [],
      numbers: [],
      hashtags: [],
    };
  }

  // Extract non-NLP categories BEFORE NLP (these are always categorized)
  const urls = extractUrls(text);
  const numbers = extractNumbers(text);
  const hashtags = extractHashtags(text);

  // Use compromise for local NLP analysis
  const doc = nlp(text);

  // Helper to get unique lowercase words from a tag match
  const getUniqueWords = (tag: string): string[] => {
    const words = doc.match(tag).out("array");
    return Array.from(
      new Set(
        (words as string[])
          .map((w: string) => normalizeTokenForSyntaxLookup(w))
          .filter((w: string) => w.length > 0),
      ),
    );
  };

  // Extract articles from text using static list (more reliable than NLP)
  const extractArticles = (text: string): string[] => {
    const words = text
      .split(/\s+/)
      .map((word) => normalizeTokenForSyntaxLookup(word))
      .filter((word) => word.length > 0);
    return Array.from(new Set(words.filter((w) => ARTICLES.includes(w))));
  };

  // Extract prepositions - combine NLP with static list for better coverage
  const extractPrepositions = (text: string): string[] => {
    const nlpPrepositions = getUniqueWords("#Preposition");
    const words = text
      .split(/\s+/)
      .map((word) => normalizeTokenForSyntaxLookup(word))
      .filter((word) => word.length > 0);
    const staticPrepositions = words.filter((w) => PREPOSITIONS.includes(w));
    return Array.from(new Set([...nlpPrepositions, ...staticPrepositions]));
  };

  // Extract interjections from text using static list
  const extractInterjections = (text: string): string[] => {
    const normalizedWords = text
      .split(/\s+/)
      .map((word) => normalizeTokenForSyntaxLookup(word))
      .filter((word) => word.length > 0);
    const wordSet = new Set(normalizedWords);
    return Array.from(new Set(INTERJECTIONS.filter((i) => wordSet.has(i))));
  };

  const result: SyntaxAnalysis = {
    nouns: getUniqueWords("#Noun"),
    pronouns: getUniqueWords("#Pronoun"),
    verbs: getUniqueWords("#Verb"),
    adjectives: getUniqueWords("#Adjective"),
    adverbs: getUniqueWords("#Adverb"),
    prepositions: extractPrepositions(text),
    conjunctions: getUniqueWords("#Conjunction"),
    articles: extractArticles(text),
    interjections: extractInterjections(text),
    urls,
    numbers,
    hashtags,
  };

  // Add contractions to appropriate categories
  extractContractions(text, result);

  return result;
};
