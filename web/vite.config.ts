import babel from '@rolldown/plugin-babel';
import tailwindcss from '@tailwindcss/vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { msw } from 'msw/vite';
import fs, { globSync } from 'node:fs';
import { availableParallelism } from 'node:os';
import path from 'node:path';
import { loadEnv } from 'vite';
import { configDefaults, defineConfig } from 'vitest/config';

const API_DEV_URL = 'http://localhost:3000';
const { version: appVersion } = JSON.parse(fs.readFileSync('package.json', 'utf8')) as { version: string };

const alias = {
  '@api': path.resolve(import.meta.dirname, 'src/common/api'),
  '@services': path.resolve(import.meta.dirname, 'src/common/api/services'),
  '@application': path.resolve(import.meta.dirname, 'src/application'),
  '@app-types': path.resolve(import.meta.dirname, 'src/types'),
  '@utils': path.resolve(import.meta.dirname, 'src/common/utils'),
  '@pages': path.resolve(import.meta.dirname, 'src/pages'),
  '@components': path.resolve(import.meta.dirname, 'src/common/components'),
  '@hooks': path.resolve(import.meta.dirname, 'src/common/hookUtils'),
  '@mocks': path.resolve(import.meta.dirname, 'src/mocks'),
  '@test-utils': path.resolve(import.meta.dirname, 'src/testUtils.tsx'),
};

// One worker per core thrashes on a heavy render tree. The cap also covers CI, which reports the host's cores.
const maxWorkers = process.env.VITEST_MAX_FORKS
  ? Number(process.env.VITEST_MAX_FORKS)
  : Math.max(1, Math.min(4, Math.floor(availableParallelism() / 2)));

// Playwright specs end in .e2e.test.ts, which vitest's default include would pick up.
const baseExclude = [...configDefaults.exclude, 'e2e/**', 'tests-examples/*'];

// Files that `vi.mock` a module get their own project, so a module mock never leaks into another file.
const mockingTests = globSync('src/**/*.test.{ts,tsx}')
  .map((file) => file.replace(/\\/g, '/'))
  .filter((file) => fs.readFileSync(file, 'utf8').includes('vi.mock('));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  const projectPath = env.VITE_PROJECT_PATH || '/';

  return {
    base: projectPath,
    // Shown on the Settings page; read once at build time from package.json.
    define: { __APP_VERSION__: JSON.stringify(appVersion) },
    plugins: [
      react(),
      // React Compiler: components and hooks are memoized at build time, so no manual useMemo/useCallback.
      babel({ presets: [reactCompilerPreset()] }),
      tailwindcss(),
      // Serves the MSW worker script in dev and provides `virtual:msw` (see src/mocks/browser.ts).
      msw(),
    ],
    test: {
      globals: true,
      exclude: baseExclude,
      setupFiles: ['./src/setupTests.ts'],
      // `.test.ts` runs on `node`. One that needs a DOM carries a `// @vitest-environment jsdom` docblock.
      // Inline projects inherit the root config (Vitest 5), so plugins and setup are declared once above.
      projects: [
        {
          test: {
            name: 'node',
            environment: 'node',
            include: ['src/**/*.test.ts'],
            exclude: [...baseExclude, ...mockingTests],
          },
        },
        {
          test: {
            name: 'dom',
            environment: 'jsdom',
            include: ['src/**/*.test.tsx'],
            exclude: [...baseExclude, ...mockingTests],
          },
        },
        {
          test: { name: 'mocked', environment: 'jsdom', include: mockingTests },
        },
      ],
      restoreMocks: true,
      testTimeout: 60000,
      minWorkers: 1,
      maxWorkers,
      css: false,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html', 'lcov'],
        reportsDirectory: './coverage',
        include: ['src/**/*.{ts,tsx}'],
        // Files with nothing to cover: declarations, barrels, mocks, the test harness and the entry point.
        exclude: [
          'src/**/*.test.{ts,tsx}',
          'src/**/*.type.ts',
          'src/**/*.d.ts',
          'src/**/index.ts',
          'src/mocks/**',
          'src/setupTests.ts',
          'src/testUtils.tsx',
          'src/main.tsx',
        ],
      },
    },
    resolve: {
      alias,
    },
    // Same origin in dev as in production (Caddy): /api is the Fastify API, /uploads its image files.
    server: {
      proxy: {
        '/api': {
          target: API_DEV_URL,
          changeOrigin: true,
          rewrite: (requestPath) => requestPath.replace(/^\/api/, ''),
        },
        '/uploads': { target: API_DEV_URL, changeOrigin: true },
      },
    },
  };
});
