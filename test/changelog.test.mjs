import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MAINTENANCE_NOTE, buildDiscordPayload, cleanEntry } from '../src/changelog.mjs';

const REPO = 'https://github.com/OutlastTrialsStats/reagent-studio';
const RELEASE_URL = `${REPO}/releases/tag/v0.7.0`;

const RELEASE_0_7_0 = `## [0.7.0](${REPO}/compare/v0.6.1...v0.7.0) (2026-10-27)


### Features

* **studio:** add a setting to turn the watermark off ([9157053](${REPO}/commit/91570537b937e83c270c41f622076b85a3168a68))


### Bug Fixes

* **core:** add a device profile that keeps phones off the high texture tier ([b6ad822](${REPO}/commit/b6ad822888c84d99204b6bc509e8800aed540753))
* **embed:** default the texture quality to auto so phones no longer load high textures ([43c3349](${REPO}/commit/43c3349c43cda108eec71cd6d34bf18abc7e5136))


### Performance Improvements

* **core:** render on demand and update shadows only when needed ([9dad7af](${REPO}/commit/9dad7afad3ffc63d034c9c5780b241817812ec27))


### Miscellaneous Chores

* **deps-dev:** bump typescript-eslint from 8.71.2 to 8.72.0 ([a61116c](${REPO}/commit/a61116c0e893cdc088a890fae54e04e5d7614c72))


### Code Refactoring

* remove content feature toggles ([45864b1](${REPO}/commit/45864b10f594a22ca926a8dee430f940f8fd1bdb))
`;

const RELEASE_0_5_1 = `## [0.5.1](${REPO}/compare/v0.5.0...v0.5.1) (2026-10-13)


### Continuous Integration

* build with npc characters by default ([687b9d6](${REPO}/commit/687b9d6a20d546240c50ac5c4fb8dce48da1a44b))
`;

function payloadOf(notes, overrides = {}) {
  return buildDiscordPayload({
    notes,
    product: 'Reagent Studio',
    version: 'v0.7.0',
    url: 'https://studio.outlasttrialsstats.com',
    moreUrl: RELEASE_URL,
    timestamp: 'now',
    ...overrides,
  });
}

function descriptionOf(notes) {
  return payloadOf(notes).embeds[0].description;
}

describe('buildDiscordPayload', () => {
  it('builds one update embed without mentions', () => {
    const payload = payloadOf(RELEASE_0_7_0);
    assert.deepEqual(payload.allowed_mentions, { parse: [] });
    assert.equal(payload.content, undefined);
    assert.equal(payload.embeds.length, 1);
    assert.equal(payload.embeds[0].title, 'Reagent Studio Update v0.7.0');
    assert.equal(payload.embeds[0].url, 'https://studio.outlasttrialsstats.com');
  });

  it('leaves the url out when none is given', () => {
    const payload = payloadOf(RELEASE_0_7_0, { product: 'Discord Bot', url: '' });
    assert.equal(payload.embeds[0].title, 'Discord Bot Update v0.7.0');
    assert.equal('url' in payload.embeds[0], false);
  });

  it('keeps only user facing sections without links or scopes', () => {
    assert.equal(
      descriptionOf(RELEASE_0_7_0),
      [
        '**Features**',
        '- Add a setting to turn the watermark off',
        '',
        '**Bug Fixes**',
        '- Add a device profile that keeps phones off the high texture tier',
        '- Default the texture quality to auto so phones no longer load high textures',
        '',
        '**Performance Improvements**',
        '- Render on demand and update shadows only when needed',
      ].join('\n'),
    );
  });

  it('posts a maintenance note when nothing user facing changed', () => {
    assert.equal(descriptionOf(RELEASE_0_5_1), MAINTENANCE_NOTE);
    assert.equal(descriptionOf(''), MAINTENANCE_NOTE);
  });

  it('drops duplicate entries', () => {
    const notes = '### Bug Fixes\n\n* fix a thing ([aaaaaaa](x))\n* fix a thing ([bbbbbbb](y))\n';
    assert.equal(descriptionOf(notes), '**Fixes**\n• Fix a thing');
  });

  it('truncates long notes on a line boundary and links the release', () => {
    const entries = Array.from({ length: 200 }, (_, index) => `* feature number ${index} with a long text`);
    const description = descriptionOf(`### Features\n\n${entries.join('\n')}\n`);
    assert.ok(description.length <= 4000);
    assert.ok(description.endsWith(`…and more: ${RELEASE_URL}`));
    assert.doesNotMatch(description, /feature number \d+ with a long te$/m);
  });
});

describe('cleanEntry', () => {
  it('removes issue references and closes tails', () => {
    assert.equal(
      cleanEntry(`**deps:** combine updates [#16](${REPO}/issues/16) [#15](${REPO}/issues/15) ([bb3e1d1](x))`),
      'Combine updates',
    );
    assert.equal(cleanEntry(`fix the door, closes [#12](${REPO}/issues/12)`), 'Fix the door');
    assert.equal(cleanEntry('add the toy factory map (#90)'), 'Add the toy factory map');
    assert.equal(
      cleanEntry(`**data:** add the toy factory map ([#90](${REPO}/issues/90)) ([9ff4ab3](${REPO}/commit/9ff4ab3))`),
      'Add the toy factory map',
    );
    assert.equal(cleanEntry('keep the door that closes'), 'Keep the door that closes');
  });

  it('turns remaining links into text', () => {
    assert.equal(cleanEntry('use the [new logo](https://example.com/logo)'), 'Use the new logo');
  });
});
