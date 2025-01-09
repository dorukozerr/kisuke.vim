import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginPrettier from 'eslint-plugin-prettier';

/** @type {import('eslint').Linter.Config[]} */
export default [
  { files: ['**/*.{js,mjs,cjs,ts}'] },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ['./node_modules', './dist'],
    plugins: {
      prettier: pluginPrettier
    },
    rules: {
      'prettier/prettier': 'error',
      'arrow-body-style': 'error',
      'prefer-arrow-callback': 'error',
      'no-restricted-syntax': [
        'error',
        'FunctionExpression',
        'FunctionDeclaration'
      ],
      'no-console': ['error', { allow: ['warn', 'error'] }]
    }
  }
];
