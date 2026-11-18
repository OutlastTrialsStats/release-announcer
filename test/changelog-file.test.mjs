import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { extractSection } from '../src/changelog-file.mjs';
import { buildDescription } from '../src/changelog.mjs';

const REPO = 'https://github.com/OutlastTrialsStats/reagent-studio';

const CHANGELOG = `# Changelog

## [0.8.0](${REPO}/compare/v0.7.0...v0.8.0) (2026-11-04)


### Features

* eye gaze control ([51d00f4](${REPO}/commit/51d00f4))

## [0.7.10](${REPO}/compare/v0.7.1...v0.7.10) (2026-10-30)


### Bug Fixes

* not this one ([aaaaaaa](${REPO}/commit/aaaaaaa))

## [0.7.1](${REPO}/compare/v0.7.0...v0.7.1) (2026-10-28)


### Bug Fixes

* **core:** keep the camera inside rooms ([bbbbbbb](${REPO}/commit/bbbbbbb))
* Phones load textures faster now

## 0.7.0 (2026-10-27)

### Features

* first release
`;

describe('extractSection', () => {
  it('returns the section of a release-please heading', () => {
    assert.equal(
      buildDescription(extractSection(CHANGELOG, 'v0.8.0')),
      '**Features**\n- Eye gaze control',
    );
  });

  it('stops at the next version and does not match a longer version', () => {
    assert.equal(
      buildDescription(extractSection(CHANGELOG, 'v0.7.1')),
      '**Bug Fixes**\n- Keep the camera inside rooms\n- Phones load textures faster now',
    );
  });

  it('reads plain headings at the end of the file', () => {
    assert.equal(extractSection(CHANGELOG, '0.7.0'), '### Features\n\n* first release');
  });

  it('returns undefined for a missing version', () => {
    assert.equal(extractSection(CHANGELOG, 'v9.9.9'), undefined);
  });
});
