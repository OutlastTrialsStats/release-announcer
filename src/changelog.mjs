export const MAINTENANCE_NOTE = 'Maintenance and internal improvements.';
export const DEFAULT_COLOR = 0xef4444;

const DESCRIPTION_LIMIT = 4000;

const SHOWN_SECTIONS = [
  { heading: 'Features', label: 'Features' },
  { heading: 'Bug Fixes', label: 'Bug Fixes' },
  { heading: 'Performance Improvements', label: 'Performance Improvements' },
];

const COMMIT_REFERENCE = /\s*\(\[[0-9a-f]{7,40}\]\([^)]*\)\)/g;
const ISSUE_REFERENCE = /\s*\[#\d+\]\([^)]*\)/g;
const PLAIN_ISSUE_REFERENCE = /\s*\(#\d+\)/g;
const EMPTY_PARENTHESES = /\s*\(\s*\)/g;
const CLOSES_TAIL = /,\s*closes\b[\s#\d,]*$/i;
const SCOPE_PREFIX = /^\*\*[^*]+:\*\*\s*/;
const MARKDOWN_LINK = /\[([^\]]*)\]\([^)]*\)/g;

export function parseSections(notes) {
  const sections = new Map();
  let current;
  for (const rawLine of notes.split(/\r?\n/)) {
    const line = rawLine.trim();
    const heading = /^###\s+(.+)$/.exec(line);
    if (heading) {
      current = heading[1].trim();
      if (!sections.has(current)) sections.set(current, []);
      continue;
    }
    if (/^##\s/.test(line)) {
      current = undefined;
      continue;
    }
    const bullet = /^[*-]\s+(.+)$/.exec(line);
    if (bullet && current) sections.get(current).push(bullet[1]);
  }
  return sections;
}

export function cleanEntry(entry) {
  const text = entry
    .replace(COMMIT_REFERENCE, '')
    .replace(ISSUE_REFERENCE, '')
    .replace(PLAIN_ISSUE_REFERENCE, '')
    .replace(EMPTY_PARENTHESES, '')
    .replace(CLOSES_TAIL, '')
    .replace(SCOPE_PREFIX, '')
    .replace(MARKDOWN_LINK, '$1')
    .replace(/\s+/g, ' ')
    .trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function buildDescription(notes) {
  const sections = parseSections(notes);
  const blocks = [];
  for (const { heading, label } of SHOWN_SECTIONS) {
    const entries = [...new Set((sections.get(heading) ?? []).map(cleanEntry).filter(Boolean))];
    if (entries.length === 0) continue;
    blocks.push([`**${label}**`, ...entries.map((entry) => `- ${entry}`)].join('\n'));
  }
  return blocks.length === 0 ? MAINTENANCE_NOTE : blocks.join('\n\n');
}

export function truncateDescription(description, moreUrl, limit = DESCRIPTION_LIMIT) {
  if (description.length <= limit) return description;
  const moreLine = moreUrl ? `\n…and more: ${moreUrl}` : '\n…and more';
  const kept = [];
  let length = 0;
  for (const line of description.split('\n')) {
    if (length + line.length + 1 + moreLine.length > limit) break;
    kept.push(line);
    length += line.length + 1;
  }
  return `${kept.join('\n').trimEnd()}\n${moreLine}`;
}

export function buildDiscordPayload({
  notes,
  product,
  version,
  url,
  moreUrl,
  color = DEFAULT_COLOR,
  timestamp = new Date().toISOString(),
}) {
  const plainVersion = version.replace(/^v/, '');
  const embed = {
    title: `${product} Update v${plainVersion}`,
    color,
    description: truncateDescription(buildDescription(notes), moreUrl),
    timestamp,
  };
  if (url) embed.url = url;
  return { allowed_mentions: { parse: [] }, embeds: [embed] };
}
