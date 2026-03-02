/**
 * Utility functions for handling strikethrough markers in markdown text.
 * Handles merging adjacent/overlapping strikethrough ranges.
 */

const MARKER = "~~";
const MARKER_LENGTH = MARKER.length;
const STRIKETHROUGH_BLOCK_REGEX = /~~(?:[^~]|~(?!~))+~~/g;
const STRIKETHROUGH_BLOCK_TEST_REGEX = /~~(?:[^~]|~(?!~))+~~/;

/**
 * Strips all strikethrough markers from text.
 */
export function stripStrikethroughMarkers(text: string): string {
  return text.replace(/~~/g, "");
}

/**
 * Returns true when the text contains at least one complete strikethrough block.
 */
export function hasStrikethroughBlocks(text: string): boolean {
  return STRIKETHROUGH_BLOCK_TEST_REGEX.test(text);
}

/**
 * Removes complete `~~...~~` segments from the text.
 * This is used by the "magic clean" action to keep only non-struck writing.
 */
export function removeStrikethroughBlocks(text: string): string {
  return text
    .replace(STRIKETHROUGH_BLOCK_REGEX, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]+$/g, "");
}

/**
 * Checks if a position is inside an existing strikethrough region.
 * Returns the bounds of the region if found.
 */
function findStrikethroughRegion(
  content: string,
  position: number,
): { start: number; end: number } | null {
  // Find all strikethrough regions
  const regex = /~~([^~]+)~~/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const regionStart = match.index;
    const regionEnd = match.index + match[0].length;

    if (position >= regionStart && position <= regionEnd) {
      return { start: regionStart, end: regionEnd };
    }
  }

  return null;
}

/**
 * Apply strikethrough to a selection, merging with adjacent markers.
 *
 * Cases handled:
 * - Simple: `hello` -> `~~hello~~`
 * - Contains markers: `~~hello~~ world` -> `~~hello world~~`
 * - Adjacent left: extend `~~hello~~` with ` world` -> `~~hello world~~`
 * - Adjacent right: extend `hello ` with `~~world~~` -> `~~hello world~~`
 * - Overlapping both: `~~a~~ b ~~c~~` -> `~~a b c~~`
 *
 * @param content - The full document content
 * @param selectionStart - Start of selection
 * @param selectionEnd - End of selection
 * @returns New content with strikethrough applied
 */
export function applyStrikethrough(
  content: string,
  selectionStart: number,
  selectionEnd: number,
): string {
  if (selectionStart === selectionEnd) return content;

  // Get the selected text
  const selectedText = content.substring(selectionStart, selectionEnd);

  // Check for adjacent strikethrough regions
  const leftRegion = findStrikethroughRegion(content, selectionStart - 1);
  const rightRegion = findStrikethroughRegion(content, selectionEnd);

  // Check if selection starts or ends inside a strikethrough region
  const startRegion = findStrikethroughRegion(content, selectionStart);
  const endRegion = findStrikethroughRegion(content, selectionEnd - 1);

  // Calculate the final bounds considering all adjacent/overlapping regions
  let finalStart = selectionStart;
  let finalEnd = selectionEnd;

  // Extend left if adjacent to or overlapping a strikethrough
  if (leftRegion) {
    finalStart = leftRegion.start;
  }
  if (startRegion && startRegion.start < finalStart) {
    finalStart = startRegion.start;
  }

  // Extend right if adjacent to or overlapping a strikethrough
  if (rightRegion) {
    finalEnd = rightRegion.end;
  }
  if (endRegion && endRegion.end > finalEnd) {
    finalEnd = endRegion.end;
  }

  // Extract the text we're going to wrap
  const textToWrap = content.substring(finalStart, finalEnd);

  // Strip all existing markers from the text
  const cleanText = stripStrikethroughMarkers(textToWrap);

  // Build the new content
  const before = content.substring(0, finalStart);
  const after = content.substring(finalEnd);
  const newContent = before + MARKER + cleanText + MARKER + after;

  return newContent;
}

/**
 * Check if the selected text is already entirely struck through.
 * Used to determine if we should remove strikethrough instead of adding it.
 */
export function isFullyStruckThrough(
  content: string,
  selectionStart: number,
  selectionEnd: number,
): boolean {
  // Check if the selection starts at ~~ and ends at ~~
  const hasOpenMarker =
    content.substring(selectionStart - MARKER_LENGTH, selectionStart) ===
    MARKER;
  const hasCloseMarker =
    content.substring(selectionEnd, selectionEnd + MARKER_LENGTH) === MARKER;

  if (!hasOpenMarker || !hasCloseMarker) return false;

  // Check that the selected text doesn't contain any markers
  const selectedText = content.substring(selectionStart, selectionEnd);
  return !selectedText.includes(MARKER);
}

/**
 * Remove strikethrough from a selection that is fully struck through.
 */
export function removeStrikethrough(
  content: string,
  selectionStart: number,
  selectionEnd: number,
): string {
  const before = content.substring(0, selectionStart - MARKER_LENGTH);
  const selectedText = content.substring(selectionStart, selectionEnd);
  const after = content.substring(selectionEnd + MARKER_LENGTH);

  return before + selectedText + after;
}
