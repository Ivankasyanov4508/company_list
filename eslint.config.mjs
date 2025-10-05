import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';

export default tseslint.config(
  // Игнорируемые файлы
  {
    ignores: [
      'dist/',
      'node_modules/',
      '**/*.d.ts',
      'coverage/',
      'vite.config.ts',
      '*.config.ts',
    ],
  },

  // Базовая конфигурация для JavaScript
  {
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
  },

  // Конфигурация для TypeScript файлов в src
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    extends: [...tseslint.configs.recommended, prettierConfig],
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      prettier: prettierPlugin,
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    rules: {
      // Prettier правила
      'prettier/prettier': 'error',

      // TypeScript правила
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-inferrable-types': 'off',

      // Общие правила
      'no-console': 'off',
      'prefer-const': 'error',
      'no-var': 'error',
      'no-duplicate-imports': 'error',
    },
  }
);
