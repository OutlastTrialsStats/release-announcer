function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function extractSection(markdown, version) {
  const plainVersion = version.replace(/^v/, '');
  const versionHeading = new RegExp(`^##\\s+\\[?v?${escapeRegExp(plainVersion)}\\]?(?![\\w.-])`);
  const lines = markdown.split(/\r?\n/);
  const start = lines.findIndex((line) => versionHeading.test(line.trim()));
  if (start === -1) return undefined;
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => /^##\s/.test(line.trim()));
  return (end === -1 ? rest : rest.slice(0, end)).join('\n').trim();
}
