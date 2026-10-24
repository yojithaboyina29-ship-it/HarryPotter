// Clean profanity moderation filter
const BAD_WORDS = new Set([
  'damn', 'hell', 'bastard', 'crap', 'bitch', 'ass', 'asshole', 'dick', 'fuck', 'shit'
]);

/** Returns true if the text contains profanity. */
export function containsProfanity(text: string): boolean {
  if (!text) return false;
  const words = text.toLowerCase().replace(/[^a-zA-Z0-9\s]/g, ' ').split(/\s+/);
  return words.some(w => BAD_WORDS.has(w));
}

/** Clean profanity from text, replacing bad words with asterisks. */
export function cleanText(text: string): string {
  if (!text) return text;
  let cleaned = text;
  for (const bad of BAD_WORDS) {
    const reg = new RegExp(`\\b${bad}\\b`, 'gi');
    cleaned = cleaned.replace(reg, '*'.repeat(bad.length));
  }
  return cleaned;
}
