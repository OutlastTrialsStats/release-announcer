# Release Announcer

GitHub Action that posts a release changelog to Discord as an embed titled `<product> Update vX.Y.Z`.

It reads the version's section of `CHANGELOG.md` on the default branch. Only **Features**, **Bug Fixes** and
**Performance Improvements** are shown. Commit, compare and issue links and scopes like `**core:**` are removed.
A release without user-facing changes posts "Maintenance and internal improvements." Mentions are disabled.

## Editing a post

1. release-please keeps a release PR open with the new `CHANGELOG.md` section.
2. Right before merging, edit `CHANGELOG.md` in that PR: delete lines to hide them or reword them. Any later push to
   `main` makes release-please rebuild the PR, so edit last.
3. Merge. The `announce` job posts the edited section.

To post a release again, for example after fixing `CHANGELOG.md` on `main`, run the repo's **Announce** workflow.
With `dry-run` checked it only writes a preview to the job summary.

## Release workflow

```yaml
  announce:
    needs: release-please
    if: needs.release-please.outputs.release_created == 'true'
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: OutlastTrialsStats/release-announcer@v1
        with:
          webhook-url: ${{ secrets.DISCORD_RELEASE_WEBHOOK }}
          product: Reagent Studio
          url: https://studio.outlasttrialsstats.com
          tag: ${{ needs.release-please.outputs.tag_name }}
```

## Announce workflow

```yaml
name: Announce

on:
  workflow_dispatch:
    inputs:
      tag:
        description: Release tag, e.g. v1.2.3
        required: true
      dry-run:
        description: Only show a preview in the job summary
        type: boolean
        default: true

permissions:
  contents: read

jobs:
  announce:
    runs-on: ubuntu-latest
    steps:
      - uses: OutlastTrialsStats/release-announcer@v1
        with:
          webhook-url: ${{ secrets.DISCORD_RELEASE_WEBHOOK }}
          product: Reagent Studio
          url: https://studio.outlasttrialsstats.com
          tag: ${{ inputs.tag }}
          dry-run: ${{ inputs.dry-run }}
```

## Inputs

| Input          | Default               | Description                                               |
| -------------- | --------------------- | --------------------------------------------------------- |
| `webhook-url`  |                       | Discord webhook URL. Empty skips the step.                |
| `product`      |                       | Product name in the title (required)                      |
| `url`          |                       | Link for the title and the "…and more" line               |
| `tag`          |                       | Release tag (required)                                    |
| `source`       | `changelog`           | `changelog` (CHANGELOG.md) or `release` (GitHub release) |
| `dry-run`      | `false`               | `true` posts nothing and writes a preview                 |
| `repository`   | `GITHUB_REPOSITORY`   | owner/name                                                |
| `github-token` | `${{ github.token }}` | Reads CHANGELOG.md or the release                         |
| `color`        | `0xef4444`            | Embed color                                               |

## Local dry run

```sh
env DRY_RUN=1 INPUT_PRODUCT="Reagent Studio" INPUT_TAG=v0.8.0 INPUT_REPOSITORY=OutlastTrialsStats/reagent-studio "INPUT_GITHUB-TOKEN=$(gh auth token)" node src/main.mjs
```

## Releasing

Tag `vX.Y.Z` and move the `v1` tag to it.
