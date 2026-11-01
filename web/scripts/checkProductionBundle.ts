// The last step of `yarn build` (Yarn 4 runs no postbuild hook), so the Docker image and the demo build both pass
// through it: fails the build when dist/ holds anything that only exists in `yarn dev`. The dev sign-in picker and the "Development mode"
// banner render under import.meta.env.DEV, which Vite turns into `false` and drops from a build; this proves it.
import { globSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { DEV_SIGN_IN_PASSWORD } from '../src/common/utils/devPasswordUtils.ts';

const DIST_DIR = join(import.meta.dirname, '..', 'dist');
const EXIT_LEAK_FOUND = 1;

// The seed password, the banner's title and the picker's label and first option. A minifier may write the ellipsis
// as an escape, so both spellings are looked for.
const DEV_ONLY_TRACES = [
  DEV_SIGN_IN_PASSWORD,
  'Development mode',
  'Sign in as…',
  'Sign in as\\u2026',
  'Pick a seeded user',
];

type Leak = { file: string; trace: string };

function leaksIn(file: string): Leak[] {
  const content = readFileSync(file, 'utf8');

  return DEV_ONLY_TRACES.filter((trace) => content.includes(trace)).map((trace) => ({ file, trace }));
}

const builtFiles = globSync('**/*.{js,mjs,html,css,json,map}', { cwd: DIST_DIR }).map((file) => join(DIST_DIR, file));

if (builtFiles.length === 0) {
  console.error(`No built files in ${DIST_DIR}: run the build first.`);
  process.exit(EXIT_LEAK_FOUND);
}

const leaks = builtFiles.flatMap(leaksIn);

if (leaks.length > 0) {
  for (const { file, trace } of leaks) console.error(`Dev-only "${trace}" found in ${relative(DIST_DIR, file)}`);
  process.exit(EXIT_LEAK_FOUND);
}
