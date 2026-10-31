import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import prettier from 'eslint-config-prettier/flat';
import tseslint from 'typescript-eslint';

export default defineConfig([
  { ignores: ['dist/**', 'coverage/**', 'node_modules/**', '.yarn/**', 'src/generated/**', 'data/**'] },
  js.configs.recommended,
  // Type-aware rules (no-floating-promises, no-misused-promises, ...) need a TS project for every linted file.
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/naming-convention': ['error', { selector: 'typeLike', format: ['PascalCase'] }],
      // Fastify plugins and handlers are async by signature even when their body has nothing to await.
      '@typescript-eslint/require-await': 'off',
      'no-console': ['error', { allow: ['error'] }],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
    },
  },
  {
    files: ['**/*.js'],
    extends: [tseslint.configs.disableTypeChecked],
  },
  prettier,
]);
