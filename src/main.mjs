import { appendFileSync } from 'node:fs';
import { DEFAULT_COLOR, buildDiscordPayload } from './changelog.mjs';
import { extractSection } from './changelog-file.mjs';

function input(name) {
  return (process.env[`INPUT_${name.replace(/ /g, '_').toUpperCase()}`] ?? '').trim();
}

function fail(message) {
  console.log(`::error::${message}`);
  process.exit(1);
}

const server = process.env.GITHUB_SERVER_URL || 'https://github.com';
const apiUrl = process.env.GITHUB_API_URL || 'https://api.github.com';

async function github(path, token, accept) {
  return fetch(`${apiUrl}${path}`, {
    headers: { Accept: accept, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
}

async function changelogNotes(repository, tag, token) {
  const response = await github(`/repos/${repository}/contents/CHANGELOG.md`, token, 'application/vnd.github.raw');
  if (!response.ok) fail(`Could not read CHANGELOG.md: ${response.status} ${await response.text()}`);
  const notes = extractSection(await response.text(), tag);
  if (notes === undefined) fail(`CHANGELOG.md has no section for ${tag}.`);
  return notes;
}

async function releaseNotes(repository, tag, token) {
  const response = await github(
    `/repos/${repository}/releases/tags/${encodeURIComponent(tag)}`,
    token,
    'application/vnd.github+json',
  );
  if (!response.ok) fail(`Could not read release ${tag}: ${response.status} ${await response.text()}`);
  return (await response.json()).body ?? '';
}

function writePreview(payload) {
  const embed = payload.embeds[0];
  const title = embed.url ? `[${embed.title}](${embed.url})` : embed.title;
  const preview = `### ${title}\n\n${embed.description}\n`;
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, preview);
  console.log(JSON.stringify(payload, null, 2));
}

const product = input('product');
const tag = input('tag');
if (!product) fail('product is required.');
if (!tag) fail('tag is required.');

const repository = input('repository') || process.env.GITHUB_REPOSITORY;
const source = input('source') || 'changelog';
if (!['changelog', 'release'].includes(source)) fail(`Unknown source "${source}", use changelog or release.`);

const dryRun = process.env.DRY_RUN === '1' || input('dry-run') === 'true';
const webhookUrl = input('webhook-url');
if (!webhookUrl && !dryRun) {
  console.log('No webhook-url given, skipping the Discord post.');
  process.exit(0);
}

const token = input('github-token');
const notes = source === 'release' ? await releaseNotes(repository, tag, token) : await changelogNotes(repository, tag, token);

const colorInput = input('color');
const color = colorInput ? Number(colorInput) : DEFAULT_COLOR;
if (!Number.isInteger(color) || color < 0 || color > 0xffffff) fail(`Invalid color "${colorInput}".`);

const url = input('url');
const moreUrl = url || `${server}/${repository}/releases/tag/${encodeURIComponent(tag)}`;
const payload = buildDiscordPayload({ notes, product, version: tag, url, moreUrl, color });

if (dryRun) {
  writePreview(payload);
  process.exit(0);
}

const response = await fetch(webhookUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});
if (!response.ok) fail(`Discord webhook failed with ${response.status}: ${await response.text()}`);

console.log(`Posted "${payload.embeds[0].title}" to Discord.`);
