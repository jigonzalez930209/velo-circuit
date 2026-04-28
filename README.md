# velo-circuit

Framework-agnostic SVG circuit editor for Boukamp DSL circuits used in electrochemical impedance spectroscopy (EIS).

## Why velo-circuit

- Unified circuit model from DSL parsing to rendered SVG output
- Pure TypeScript core with no runtime UI framework dependency
- Official adapters for React, Vue, Svelte, Angular, Astro and Vanilla
- Built-in editor interactions: zoom, pan, drag, diagnostics, undo/redo
- Designed to integrate with scientific tooling such as `velo-spectroz`

## Install

```bash
pnpm add velo-circuit
```

or:

```bash
npm install velo-circuit
```

## Quick Usage (Vanilla)

```ts
import { createEditor } from 'velo-circuit';

const editor = createEditor();

editor.mount(document.getElementById('canvas'), {
  initialDsl: 'R0-p(R1,C1)-Wo2',
  width: 900,
  height: 560,
});

editor.on('ast-changed', () => {
  console.log(editor.getValue());
});
```

## Local Development

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm build
pnpm docs:dev
```

## Release Workflow

CI runs in GitHub Actions on Node 22 and 24. npm publish is triggered by pushing a tag like `v0.2.0`.

You can prepare and dispatch a release with:

```bash
pnpm release:prepare -- 0.2.0
```

What it does:

- runs `typecheck`, `test`, and `build`
- bumps `package.json` and `package-lock.json` to the provided version
- creates commit `chore(release): vX.Y.Z`
- creates tag `vX.Y.Z`
- pushes branch and tag to GitHub

Required GitHub secret for publish workflow: `NPM_TOKEN`.

## License

[MIT](./LICENSE)