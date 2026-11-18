import { execFileSync } from 'node:child_process';
import { SHOWN_SECTIONS } from './changelog.mjs';

const CONVENTIONAL_SUBJECT = /^(\w+)(?:\(([^)]*)\))?!?:\s*(.+)$/;
const VERSION_BUMP = /^bump version\b/i;

export function notesFromSubjects(subjects) {
  const lines = [];
  for (const { heading, type } of SHOWN_SECTIONS) {
    const entries = [];
    for (const subject of subjects) {
      const match = CONVENTIONAL_SUBJECT.exec(subject.trim());
      if (!match || match[1].toLowerCase() !== type || VERSION_BUMP.test(match[3])) continue;
      entries.push(match[2] ? `**${match[2]}:** ${match[3]}` : match[3]);
    }
    if (entries.length === 0) continue;
    lines.push(`### ${heading}`, '', ...entries.map((entry) => `* ${entry}`), '');
  }
  return lines.join('\n');
}

function git(args, cwd) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

export function previousTag(tag, cwd) {
  try {
    return git(['describe', '--tags', '--abbrev=0', `${tag}^`], cwd);
  } catch {
    return undefined;
  }
}

export function commitSubjects(tag, previous, cwd) {
  const range = previous ? `${previous}..${tag}` : tag;
  const output = git(['log', range, '--no-merges', '--format=%s'], cwd);
  return output ? output.split('\n') : [];
}
