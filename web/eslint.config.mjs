import js from '@eslint/js';
import betterTailwindcss from 'eslint-plugin-better-tailwindcss';
import { defineConfig } from 'eslint/config';
import prettier from 'eslint-config-prettier/flat';
import jsxA11yX from 'eslint-plugin-jsx-a11y-x';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import testingLibrary from 'eslint-plugin-testing-library';
import globals from 'globals';
import fs from 'node:fs';
import path from 'node:path';
import tseslint from 'typescript-eslint';
import noHardcodedRoutePath from './eslint-rules/noHardcodedRoutePath.mjs';
import typeOnlyFileExtension from './eslint-rules/typeOnlyFileExtension.mjs';

// Real route paths, for the navigate() rule below. Only values starting with '/', to skip other strings.
const routesUtilsSource = fs.readFileSync(
  path.join(import.meta.dirname, 'src', 'application', 'routes', 'routesUtils.ts'),
  'utf8',
);
const routePaths = [
  ...new Set(
    [...routesUtilsSource.matchAll(/:\s*(['"])((?:\\.|(?!\1).)*)\1/g)]
      .map((match) => match[2])
      .filter((value) => value.startsWith('/')),
  ),
];

// Declared once: flat config replaces a rule's options, so the narrower e2e block below restates both.
const noWaitForTimeout = {
  selector: "CallExpression[callee.property.name='waitForTimeout']",
  message: 'page.waitForTimeout() is prohibited — use a web-first assertion instead.',
};

const noDirectPageInteraction = {
  selector: 'CallExpression[callee.property.name=/^(click|fill|check|selectOption|type)$/]',
  message:
    'Do not interact with the page directly in a test file — route interactions through a Page Object in e2e/pages.',
};

// One shared object: flat config throws "Cannot redefine plugin" on two objects under one name.
const localPlugin = {
  rules: {
    'type-only-file-extension': typeOnlyFileExtension,
    'no-hardcoded-route-path': noHardcodedRoutePath,
  },
};

export default defineConfig([
  {
    ignores: [
      '**/dist',
      '**/coverage',
      '**/playwright-report',
      '**/test-results',
      '**/eslint.config.mjs',
      '**/node_modules',
      '**/.yarn',
      '**/vite-env.d.ts',
    ],
  },
  js.configs.recommended,
  // Type-aware rules (no-floating-promises, no-misused-promises, ...) need a TS project for every linted file.
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
  },
  {
    // e2e/ is not referenced by the root tsconfig, so it is type-checked through its own project file.
    files: ['e2e/**/*.ts'],
    languageOptions: {
      parserOptions: { projectService: false, project: ['./tsconfig.e2e.json'], tsconfigRootDir: import.meta.dirname },
    },
  },
  {
    // Plain browser scripts outside any TS project (public/theme-init.js runs before the app, for the CSP).
    files: ['**/*.mjs', 'public/**/*.js'],
    extends: [tseslint.configs.disableTypeChecked],
  },
  // v7: includes the React Compiler rules (set-state-in-effect, purity, refs, static-components, ...).
  reactHooks.configs.flat.recommended,
  react.configs.flat.recommended,
  react.configs.flat['jsx-runtime'],
  jsxA11yX.configs.recommended,
  prettier,
  {
    plugins: {
      'react-refresh': reactRefresh,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.worker,
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // Libraries that rely on re-render side effects (react-hook-form) need a 'use no memo' opt-out.
      'react-hooks/incompatible-library': 'warn',
      'react/prop-types': 'off',
      'react/display-name': 'off',
      'react/destructuring-assignment': 'error',
      'react/boolean-prop-naming': 'error',
      'no-nested-ternary': 'error',
      '@typescript-eslint/naming-convention': ['error', { selector: 'typeLike', format: ['PascalCase'] }],
      'react/jsx-max-depth': ['warn', { max: 3 }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
    },
  },
  {
    // Tailwind 4: unknown classes, conflicting classes, and the official class order (Prettier sorts the same way).
    files: ['src/**/*.tsx'],
    extends: [betterTailwindcss.configs.recommended],
    settings: {
      'better-tailwindcss': {
        entryPoint: 'src/index.css',
        tsconfig: 'tsconfig.app.json',
        cwd: import.meta.dirname,
      },
    },
    rules: {
      'better-tailwindcss/enforce-consistent-class-order': ['warn', { order: 'official' }],
      'better-tailwindcss/enforce-consistent-line-wrapping': 'off',
    },
  },
  {
    files: ['src/**/*.tsx'],
    ignores: ['**/*.test.tsx', '**/hooks/**', '**/Hooks/**', 'src/common/components/ui/**'],
    rules: {
      'max-lines': ['warn', { max: 120, skipBlankLines: true, skipComments: true }],
    },
  },
  {
    // src/common/components/ui is vendored shadcn source (kebab-case files, several named exports per file, cva
    // variant objects beside their component). Its primitives take the label / anchor content from props, which
    // the static a11y rules cannot see. Everything else (types, hooks rules, Tailwind) still applies to it.
    files: ['src/common/components/ui/**'],
    rules: {
      'react-refresh/only-export-components': 'off',
      'jsx-a11y-x/label-has-associated-control': 'off',
      'jsx-a11y-x/anchor-has-content': 'off',
      'jsx-a11y-x/click-events-have-key-events': 'off',
      'jsx-a11y-x/no-noninteractive-element-interactions': 'off',
    },
  },
  {
    files: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    plugins: {
      'testing-library': testingLibrary,
    },
    rules: {
      'testing-library/prefer-user-event': 'error',
      'testing-library/prefer-screen-queries': 'error',
      'testing-library/no-node-access': 'error',
      'testing-library/no-container': 'error',
    },
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.property.name='toMatchSnapshot']",
          message: 'No snapshot tests — they rot silently and get rubber-stamped instead of reviewed.',
        },
      ],
    },
  },
  {
    files: ['e2e/**/*.ts'],
    rules: {
      'no-restricted-syntax': ['error', noWaitForTimeout],
    },
  },
  {
    // Both selectors repeated on purpose: flat config replaces a rule's options, it does not merge them.
    files: ['e2e/tests/**/*.e2e.test.ts'],
    rules: {
      'no-restricted-syntax': ['error', noWaitForTimeout, noDirectPageInteraction],
    },
  },
  {
    files: ['src/types/**/*.ts'],
    plugins: {
      local: localPlugin,
    },
    rules: {
      'local/type-only-file-extension': 'error',
    },
  },
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    plugins: {
      local: localPlugin,
    },
    rules: {
      'local/no-hardcoded-route-path': ['error', routePaths],
      'react/no-danger': 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
]);
