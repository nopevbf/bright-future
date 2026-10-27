/**
 * Dictionary pemetaan karakter mojibake umum akibat kerusakan encoding
 * (misalnya UTF-8 byte sequences yang salah didecode sebagai Windows-1252 / ISO-8859-1).
 */
const MOJIBAKE_REPLACEMENTS: ReadonlyArray<[pattern: RegExp, replacement: string]> = [
  // 1. Double & Single Quotes
  [/â€œ/g, '“'],
  [/\u00e2\u20ac\u0153/g, '“'],
  [/\u00e2\u20ac\u009c/g, '“'],
  [/â€˜/g, '‘'],
  [/\u00e2\u20ac\u02dc/g, '‘'],
  [/â€™/g, '’'],
  [/\u00e2\u20ac\u2122/g, '’'],

  // 2. Dashes (Em-dash & En-dash)
  [/â€”/g, '—'],
  [/\u00e2\u20ac\u2014/g, '—'],
  [/â€“/g, '–'],
  [/\u00e2\u20ac\u2013/g, '–'],

  // 3. Bullets, Marks & Rating Stars
  [/â€¢/g, '•'],
  [/\u00e2\u20ac\u00a2/g, '•'],
  [/âœ“/g, '✓'],
  [/\u00e2\u0153\u201c/g, '✓'],
  [/â˜…/g, '★'],
  [/\u00e2\u02dc\u2026/g, '★'],
  [/â­ /g, '⭐'],
  [/\u00e2\u00ad\u0090/g, '⭐'],
  [/â °/g, '⏰'],
  [/\u00e2\u008f\u00b0/g, '⏰'],

  // 4. Broken UTF-8 Emojis (Corrupted 4-byte sequences)
  [/\u00f0\u0178\u00a7\u2018\u00e2\u20ac\u008d\u00f0\u0178\u017d\u201c/g, '🧑‍🎓'],
  [/\u00f0\u0178\u2018\u00a9\u00e2\u20ac\u008d\u00f0\u0178\u008f\u00ab/g, '👩‍🏫'],
  [/\u00f0\u0178\u2014\u201c\u00ef\u00b8\u008f/g, '🗓️'],
  [/\u00f0\u0178\u201c\u2013/g, '📖'],
  [/\u00f0\u0178\u201c\u009d/g, '📝'],
  [/\u00f0\u0178\u201c\u00a0/g, '📝'],
  [/\u00f0\u0178\u201c\u201e/g, '📄'],
  [/\u00f0\u0178\u2018\u00a4/g, '👤'],
  [/\u00f0\u0178\u201c\u0161/g, '📚'],
  [/\u00f0\u0178\u201c\u2026/g, '📅'],
  [/\u00f0\u0178\u2019\u00b0/g, '💰'],
  [/\u00f0\u0178\u2019\u00b5/g, '💵'],
  [/\u00f0\u0178\u2019\u00b3/g, '💳'],
  [/\u00f0\u0178\u201c\u0152/g, '📌'],
  [/\u00f0\u0178\u2018\u00b6/g, '👶'],
  [/\u00f0\u0178\u017d\u00af/g, '🎯'],
  [/\u00f0\u0178\u2122\u008f/g, '🙏'],

  // 5. Right double quote mojibake trailing patterns
  [/\u00e2\u20ac\u009d/g, '”'],
  [/â€ /g, '”'],
  [/â€\s*$/g, '”'],
  [/â€\s+/g, '” '],
  [/â€/g, '”'],
];

/**
 * Membersihkan string dari karakter-karakter mojibake dan mengembalikannya ke karakter UTF-8 yang benar.
 *
 * @param text - String masukan yang mungkin mengandung mojibake
 * @returns String bersih dengan tipografi & simbol yang valid
 */
export function cleanMojibake(text: string): string {
  if (typeof text !== 'string') {
    return '';
  }

  let sanitized = text;
  for (const [pattern, replacement] of MOJIBAKE_REPLACEMENTS) {
    sanitized = sanitized.replace(pattern, replacement);
  }

  return sanitized;
}
