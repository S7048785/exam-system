//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'

export default [
  ...tanstackConfig,
  {
    rules: {
      'import/no-cycle': 'off',
      'import/order': 'off',
      'sort-imports': 'off',
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/require-await': 'off',
      'pnpm/json-enforce-catalog': 'off',
      'no-restricted-syntax': [
        'warn',
        {
          selector: 'JSXAttribute[name.name="className"] Literal[value=/\\s$/]',
          message: 'className 不应有尾部空格，请使用 cn() 工具函数',
        },
      ],
    },
  },
  {
    ignores: ['eslint.config.js', 'prettier.config.js'],
  },
]
