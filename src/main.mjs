import { DEFAULT_COLOR, buildDiscordPayload } from './changelog.mjs';
import { commitSubjects, notesFromSubjects, previousTag } from './commits.mjs';

function input(name) {
  return (process.env[`INPUT_${name.replace(/ /g, '_').toUpperCase()}`] ?? '').trim();
}

function fail(message) {
  console.log(`::error::${message}`);
  process.exit(1);
}

async function releaseNotes(repository, tag, token) {
  const response = await fetch(`https://api.github.com/repos/${repository}/releases/tags/${encodeURIComponent(tag)}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!response.ok) fail(`Could not read release ${tag}: ${response.status} ${await response.text()}`);
  const release = await response.json();
  return { notes: release.body ?? '', moreUrl: release.html_url };
}

function commitNotes(repository, tag) {
  const workspace = process.env.GITHUB_WORKSPACE || process.cwd();
  const previous = previousTag(tag, workspace);
  const notes = notesFromSubjects(commitSubjects(tag, previous, workspace));
  const server = process.env.GITHUB_SERVER_URL || 'https://github.com';
  const moreUrl = previous
    ? `${server}/${repository}/compare/${previous}...${tag}`
    : `${server}/${repository}/commits/${tag}`;
  return { notes, moreUrl };
}

const webhookUrl = input('webhook-url');
const dryRun = process.env.DRY_RUN === '1';
if (!webhookUrl && !dryRun) {
  console.log('No webhook-url given, skipping the Discord post.');
  process.exit(0);
}

const product = input('product');
const tag = input('tag');
if (!product) fail('product is required.');
if (!tag) fail('tag is required.');

const repository = input('repository') || process.env.GITHUB_REPOSITORY;
const source = input('source') || 'release';
if (!['release', 'commits'].includes(source)) fail(`Unknown source "${source}", use release or commits.`);

const { notes, moreUrl } =
  source === 'commits' ? commitNotes(repository, tag) : await releaseNotes(repository, tag, input('github-token'));

const colorInput = input('color');
const color = colorInput ? Number(colorInput) : DEFAULT_COLOR;
if (!Number.isInteger(color) || color < 0 || color > 0xffffff) fail(`Invalid color "${colorInput}".`);

const payload = buildDiscordPayload({ notes, product, version: tag, url: input('url'), moreUrl, color });

if (dryRun) {
  console.log(JSON.stringify(payload, null, 2));
  process.exit(0);
}

const response = await fetch(webhookUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});
if (!response.ok) fail(`Discord webhook failed with ${response.status}: ${await response.text()}`);

console.log(`Posted "${payload.embeds[0].title}" to Discord.`);
