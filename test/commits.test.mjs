import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildDescription } from '../src/changelog.mjs';
import { notesFromSubjects } from '../src/commits.mjs';

describe('notesFromSubjects', () => {
  it('groups conventional commits into the shown sections', () => {
    const notes = notesFromSubjects([
      'feat(requests): send and view images in request threads (#212)',
      'fix: keep the leaderboard sorted',
      'perf!: cache player lookups',
      'feat!: drop the old api',
      'docs(brand): add logo PNGs',
      'chore: bump version to 4.2.0',
      'Merge remote-tracking branch origin/main',
    ]);
    assert.equal(
      buildDescription(notes),
      [
        '**Features**',
        '- Send and view images in request threads',
        '- Drop the old api',
        '',
        '**Bug Fixes**',
        '- Keep the leaderboard sorted',
        '',
        '**Performance Improvements**',
        '- Cache player lookups',
      ].join('\n'),
    );
  });

  it('returns no notes when only internal commits exist', () => {
    assert.equal(notesFromSubjects(['chore: bump version to 4.1.18', 'ci: tweak']), '');
  });

  it('skips version bump commits typed as feat or fix', () => {
    assert.equal(notesFromSubjects(['fix: bump version to 1.0.1']), '');
  });
});
