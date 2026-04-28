#!/usr/bin/env node

import { execSync } from 'node:child_process';
import process from 'node:process';

function run(command) {
  execSync(command, { stdio: 'inherit' });
}

function getOutput(command) {
  return execSync(command, { encoding: 'utf8' }).trim();
}

function parseArgs(argv) {
  const flags = new Set(argv.filter((arg) => arg.startsWith('--')));
  const params = argv.filter((arg) => !arg.startsWith('--'));
  return {
    version: params[0],
    skipPush: flags.has('--no-push'),
    skipChecks: flags.has('--skip-checks'),
  };
}

function assertCleanTree() {
  const status = getOutput('git status --porcelain');
  if (status.length > 0) {
    throw new Error(
      'Working tree is not clean. Commit or stash changes before running release:prepare.'
    );
  }
}

function main() {
  const { version, skipPush, skipChecks } = parseArgs(process.argv.slice(2));
  if (!version) {
    throw new Error(
      'Missing version. Usage: pnpm release:prepare -- <version> [--no-push] [--skip-checks]'
    );
  }

  assertCleanTree();

  if (!skipChecks) {
    run('pnpm typecheck');
    run('pnpm test');
    run('pnpm build');
  }

  run(`npm version ${version} --no-git-tag-version`);
  run('git add package.json package-lock.json');
  run(`git commit -m "chore(release): v${version}"`);
  run(`git tag v${version}`);

  if (!skipPush) {
    run('git push');
    run(`git push origin v${version}`);
  }

  console.log('');
  console.log(`Release prepared for v${version}.`);
  if (skipPush) {
    console.log('Tag and commit were created locally only (--no-push).');
  } else {
    console.log('Changes and tag pushed. npm publish workflow should trigger from tag.');
  }
}

try {
  main();
} catch (error) {
  console.error('');
  console.error('[release:prepare] failed');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
