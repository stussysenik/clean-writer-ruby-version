import emojiUnicode from "emoji-unicode";

// Regex to detect emoji characters (supports Unicode emoji properties)
const EMOJI_REGEX = /(\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu;

/**
 * Check if string contains emoji characters
 */
export function containsEmoji(text: string): boolean {
  return EMOJI_REGEX.test(text);
}

/**
 * Convert emoji to UTF code (e.g., "😀" -> "U+1F600")
 */
export function emojiToUTF(emoji: string): string {
  const code = emojiUnicode(emoji);
  if (!code) return emoji;
  return `U+${code.toUpperCase()}`;
}

/**
 * Convert UTF code back to emoji (e.g., "U+1F600" -> "😀")
 */
export function utfToEmoji(utfCode: string): string {
  const hex = utfCode.replace(/^U\+/i, "");
  try {
    // Handle multi-codepoint emojis (separated by spaces)
    const codePoints = hex.split(/[\s-]+/).map((h) => parseInt(h, 16));
    return String.fromCodePoint(...codePoints);
  } catch {
    return utfCode; // Return original if invalid
  }
}

/**
 * Get all emojis in text with their positions and UTF codes
 */
export function extractEmojis(text: string): Array<{
  emoji: string;
  utf: string;
  index: number;
}> {
  const results: Array<{ emoji: string; utf: string; index: number }> = [];
  const regex = new RegExp(EMOJI_REGEX);
  let match;

  while ((match = regex.exec(text)) !== null) {
    results.push({
      emoji: match[0],
      utf: emojiToUTF(match[0]),
      index: match.index,
    });
  }

  return results;
}

/**
 * Replace emojis with UTF codes in text
 */
export function replaceEmojisWithUTF(text: string): string {
  return text.replace(EMOJI_REGEX, (emoji) => emojiToUTF(emoji));
}

/**
 * Replace UTF codes with emojis in text
 */
export function replaceUTFWithEmojis(text: string): string {
  return text.replace(
    /U\+([0-9A-Fa-f]+(?:[\s-][0-9A-Fa-f]+)*)/gi,
    (match, hex) => {
      try {
        const codePoints = hex
          .split(/[\s-]+/)
          .map((h: string) => parseInt(h, 16));
        return String.fromCodePoint(...codePoints);
      } catch {
        return match; // Return original if invalid
      }
    },
  );
}

/**
 * Count emojis in text
 */
export function countEmojis(text: string): number {
  const matches = text.match(EMOJI_REGEX);
  return matches ? matches.length : 0;
}
