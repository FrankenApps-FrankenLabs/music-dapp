// Derive a short, human song title from generated lyrics (fallback to prompt).

const SECTION_LINE = /^\s*\[.*\]\s*$/; // e.g. [Verse 1], [Chorus]

function firstStrongLine(lyrics) {
  if (!lyrics) return '';
  for (const raw of lyrics.split('\n')) {
    const line = raw.trim();
    if (!line || SECTION_LINE.test(line)) continue;
    return line;
  }
  return '';
}

function tidy(text) {
  const words = text
    .replace(/[\r\n]+/g, ' ')
    .replace(/^__own__/, '')
    .trim()
    .split(/\s+/)
    .slice(0, 6);
  let title = words.join(' ');
  if (title.length > 48) title = title.slice(0, 48).trim();
  title = title.replace(/["'.,;:!?-]+$/, '').trim();
  if (!title) return 'Untitled';
  return title.charAt(0).toUpperCase() + title.slice(1);
}

export function deriveTitle(lyrics, prompt) {
  const fromLyrics = firstStrongLine(lyrics);
  if (fromLyrics) return tidy(fromLyrics);
  if (prompt) return tidy(prompt);
  return 'Untitled';
}
