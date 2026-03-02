export type SyntaxType =
  | "noun"
  | "pronoun"
  | "verb"
  | "adjective"
  | "adverb"
  | "preposition"
  | "conjunction"
  | "article"
  | "interjection"
  | "url"
  | "number"
  | "hashtag";

export interface SyntaxAnalysis {
  nouns: string[];
  pronouns: string[];
  verbs: string[];
  adjectives: string[];
  adverbs: string[];
  prepositions: string[];
  conjunctions: string[];
  articles: string[];
  interjections: string[];
  urls: string[];
  numbers: string[];
  hashtags: string[];
}

export interface SyntaxSets {
  nouns: Set<string>;
  pronouns: Set<string>;
  verbs: Set<string>;
  adjectives: Set<string>;
  adverbs: Set<string>;
  prepositions: Set<string>;
  conjunctions: Set<string>;
  articles: Set<string>;
  interjections: Set<string>;
  urls: Set<string>;
  numbers: Set<string>;
  hashtags: Set<string>;
}

export function toSyntaxSets(analysis: SyntaxAnalysis): SyntaxSets {
  return {
    nouns: new Set(analysis.nouns),
    pronouns: new Set(analysis.pronouns),
    verbs: new Set(analysis.verbs),
    adjectives: new Set(analysis.adjectives),
    adverbs: new Set(analysis.adverbs),
    prepositions: new Set(analysis.prepositions),
    conjunctions: new Set(analysis.conjunctions),
    articles: new Set(analysis.articles),
    interjections: new Set(analysis.interjections),
    urls: new Set(analysis.urls),
    numbers: new Set(analysis.numbers),
    hashtags: new Set(analysis.hashtags),
  };
}

export interface HighlightConfig {
  nouns: boolean;
  pronouns: boolean;
  verbs: boolean;
  adjectives: boolean;
  adverbs: boolean;
  prepositions: boolean;
  conjunctions: boolean;
  articles: boolean;
  interjections: boolean;
  urls: boolean;
  numbers: boolean;
  hashtags: boolean;
}

export interface RisoTheme {
  id: string;
  name: string;
  text: string;
  background: string;
  highlight: {
    noun: string;
    pronoun: string;
    verb: string;
    adjective: string;
    adverb: string;
    preposition: string;
    conjunction: string;
    article: string;
    interjection: string;
    url: string;
    number: string;
    hashtag: string;
  };
  accent: string;
  cursor: string; // Blinking cursor color
  strikethrough: string; // Strikethrough text decoration
  selection: string; // Text selection background (rgba)
}

export interface CustomTheme extends RisoTheme {
  isCustom: boolean;
  wordVisibility: HighlightConfig;
}

export interface SavedCustomTheme {
  id: string;          // "custom_{timestamp}_{random4}"
  name: string;
  theme: RisoTheme;    // full snapshot of all theme colors
  rhymeColors?: string[];
  createdAt: number;
}

export type ViewMode = "write" | "preview";

// Song Mode types
export interface SongWord {
  text: string;
  syllables: number;
  rhymeKey: string; // normalized suffix for rhyme grouping
}

export interface SongLine {
  text: string;
  words: SongWord[];
  totalSyllables: number;
}

export interface RhymeGroup {
  key: string; // rhyme suffix identifier
  words: string[];
  colorIndex: number; // index into RHYME_COLORS palette
  approximate?: boolean; // true when rhyme detected via suffix heuristic (not CMU dict)
}

export interface FlowMetrics {
  rhymeDensity: number;          // % of words participating in rhymes (0-100)
  avgSyllablesPerLine: number;   // average syllables per non-empty line
  internalRhymeCount: number;    // count of lines with 2+ rhyming words within same line
  multiSyllabicRhymes: number;   // rhyme groups where rhymeKey length >= 3
  longestRhymeChain: number;     // largest single rhyme group word count
}

export interface RhymeScheme {
  pattern: string;     // e.g. "AABB", "ABAB", "ABBA", "Free"
  label: string;       // e.g. "Couplets", "Alternating", "Enclosed", "Free Verse"
}

export interface SongAnalysis {
  lines: SongLine[];
  rhymeGroups: RhymeGroup[];
  totalSyllables: number;
  nonLatinWarning?: boolean;
  flowMetrics: FlowMetrics;
  rhymeScheme: RhymeScheme;
}

// Color system types
export type ColorHarmonyType =
  | "complementary"
  | "analogous"
  | "triadic"
  | "split-complementary"
  | "tetradic";
export type ColorSystemMode = "free" | "system";

export interface ColorSystemConfig {
  mode: ColorSystemMode;
  harmonyType: ColorHarmonyType;
  baseHue: number; // 0-360
}
