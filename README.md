# Release Announcer

GitHub Action that posts a release changelog to Discord as an embed titled `<product> Update vX.Y.Z`.

Only **Features**, **Bug Fixes** and **Performance Improvements** are shown. Commit, compare and issue links and
scopes like `**core:**` are removed. A release without user-facing changes posts
"Maintenance and internal improvements." Mentions are disabled.

## Usage with release-please

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

## Usage without a GitHub release

With `source: commits`, the notes are built from Conventional Commit subjects between the previous tag and `tag`.
The repository must be checked out with `fetch-depth: 0` and the tag must exist locally.

```yaml
      - uses: OutlastTrialsStats/release-announcer@v1
        with:
          webhook-url: ${{ secrets.DISCORD_RELEASE_WEBHOOK }}
          product: Outlast Trials Stats
          url: https://outlasttrialsstats.com
          tag: v${{ env.NEW_VERSION }}
          source: commits
```

## Inputs

| Input          | Default               | Description                                         |
| -------------- | --------------------- | --------------------------------------------------- |
| `webhook-url`  |                       | Discord webhook URL. Empty skips the step.          |
| `product`      |                       | Product name in the title (required)                |
| `url`          |                       | Link for the title                                  |
| `tag`          |                       | Release tag (required)                              |
| `source`       | `release`             | `release` or `commits`                              |
| `repository`   | `GITHUB_REPOSITORY`   | owner/name                                          |
| `github-token` | `${{ github.token }}` | Reads the GitHub release                            |
| `color`        | `0xef4444`            | Embed color                                         |

## Local dry run

```sh
env DRY_RUN=1 INPUT_PRODUCT="Reagent Studio" INPUT_TAG=v0.8.0 INPUT_REPOSITORY=OutlastTrialsStats/reagent-studio \
  "INPUT_GITHUB-TOKEN=$(gh auth token)" node src/main.mjs
```

`DRY_RUN=1` prints the payload instead of posting it.

## Releasing

Tag `vX.Y.Z` and move the `v1` tag to it.
