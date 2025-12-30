import eslint from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import pluginPrettier from 'eslint-plugin-prettier';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores(['dist/**', 'node_modules/**']),
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ['*.config.ts', 'src/**'],
    plugins: {
      prettier: pluginPrettier,
      'simple-import-sort': simpleImportSort
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
      ],
      'no-restricted-syntax': [
        'error',
        'FunctionExpression',
        'FunctionDeclaration'
      ],
      'prettier/prettier': 'error',
      'arrow-body-style': 'error',
      'prefer-arrow-callback': 'error',
      'no-console': ['error', { allow: ['warn', 'error', 'info'] }],
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            [
              '^node:',
              '^(fs|path|crypto|stream|util|process|os|child_process|http|https|url)'
            ],
            [String.raw`^@?\w`],
            [
              '^~/index',
              '^~/types',
              '^~/schemas',
              '^~/lib',
              '^~/std-handlers',
              '^~/utils',
              '^~/'
            ],
            ['^\\.']
          ]
        }
      ],
      'simple-import-sort/exports': 'error'
    }
  }
]);
