// eslint-disable-next-line import/no-extraneous-dependencies
const { namingConvention } = require('@gridventures/eslint-config-typescript/namingConvention');

module.exports = {
  root: true,

  parser: '@typescript-eslint/parser',

  parserOptions: {
    project: 'tsconfig.eslint.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
    ecmaVersion: 2022,
    ecmaFeatures: {
      jsx: true,
    },
  },

  extends: [
    '@gridventures/eslint-config-base',
    '@gridventures/eslint-config-typescript',
    '@gridventures/eslint-config-base/prettier',
  ],

  plugins: ['import'],

  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true, // always try to resolve types under `<root>@types` directory even it doesn't contain any source code, like `@types/unist`
        // use a glob pattern
        project: ['packages/*/tsconfig.json'],
      },
    },
  },

  overrides: [
    {
      files: ['./packages/api/**/*'],

      env: {
        es6: true,
        node: true,
        browser: false,
      },

      rules: {
        'no-console': 'warn',
        'import/no-default-export': 'off',
        'max-classes-per-file': 'off',
        'no-underscore-dangle': 'off',
        'no-case-declarations': 'off',
        '@typescript-eslint/no-unused-vars': 'warn',
        '@typescript-eslint/no-empty-interface': 'off',
        '@typescript-eslint/require-await': 'off',
        '@typescript-eslint/naming-convention': [
          'error',
          ...namingConvention,
          {
            selector: 'function',
            format: ['strictCamelCase', 'UPPER_CASE', 'PascalCase'],
            leadingUnderscore: 'forbid',
            trailingUnderscore: 'forbid',
          },
          {
            selector: 'parameter',
            format: ['strictCamelCase', 'UPPER_CASE', 'PascalCase'],
            leadingUnderscore: 'allow',
            trailingUnderscore: 'allow',
          },
        ],
      },
    },

    {
      files: ['packages/app/**/*.tsx'],

      parserOptions: {
        project: 'packages/app/tsconfig.json',
      },

      env: {
        browser: true,
        es6: true,
        node: true,
      },

      extends: [
        '@gridventures/eslint-config-typescript',
        '@gridventures/eslint-config-react',
        '@gridventures/eslint-config-react/typescript',
        '@gridventures/eslint-config-react/hooks',
        '@gridventures/eslint-config-react/a11y',
        '@gridventures/eslint-config-base/prettier',
      ],

      rules: {
        '@typescript-eslint/naming-convention': [
          'error',
          ...namingConvention,
          {
            selector: 'function',
            format: ['strictCamelCase', 'UPPER_CASE', 'PascalCase'],
            leadingUnderscore: 'forbid',
            trailingUnderscore: 'forbid',
          },
          {
            selector: 'variable',
            format: ['strictCamelCase', 'UPPER_CASE', 'PascalCase'],
            leadingUnderscore: 'forbid',
            trailingUnderscore: 'forbid',
          },
        ],
      },
    },

    {
      files: ['**/*.config.*'],

      rules: {
        'import/no-default-export': 'off',
      },
    },

    {
      files: ['packages/directus/extensions/**/*'],

      rules: {
        'import/no-default-export': 'off',
        'camelcase': 'off',
        'no-console': 'warn',
        'no-param-reassign': 'off',
      },
    },
  ],
};
