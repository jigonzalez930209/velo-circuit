# Release and Publish

This project publishes to npm using GitHub Actions when a semantic tag is pushed.

## Requirements

- GitHub secret: `NPM_TOKEN`
- npm access token with publish permission over `velo-circuit`
- Node 22+ locally (Node 22/24 are validated in CI)

## CI and Publish Flows

- `CI` workflow runs on pull requests and pushes to `main`
- `Publish to npm` workflow runs on tags matching `v*`

Both workflows run:

1. `pnpm install --frozen-lockfile`
2. `pnpm typecheck`
3. `pnpm test`
4. `pnpm build`

## Automated Release Script

Use:

```bash
pnpm release:prepare -- 0.2.0
```

This command:

- validates typecheck/tests/build
- updates package version files
- creates commit `chore(release): v0.2.0`
- creates tag `v0.2.0`
- pushes branch and tag to GitHub

If you need to test the script without pushing:

```bash
pnpm release:prepare -- 0.2.0 --no-push
```
