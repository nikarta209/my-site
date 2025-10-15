import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

const sharedGlobals = {
  ...globals.browser,
  ...globals.node,
};

export default [
  { ignores: ['dist', 'supabase/**'] },
  {
    files: [
      'src/components/books/BooksMasonry.jsx',
      'src/components/hero/HeroSlide.jsx',
      'src/components/hero/HeroTabs.jsx',
      'src/components/home/SubscriptionBanner.jsx',
      'src/components/i18n/SimpleI18n.jsx',
      'src/components/layout/Footer.jsx',
      'src/components/layout/SubNavigation.jsx',
      'src/components/sections/Section.jsx',
      'src/lib/api/books.js',
      'src/lib/banners.js',
      'src/lib/logger.js',
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: sharedGlobals,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: { react: { version: '18.3' } },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'react/jsx-no-target-blank': 'off',
      'react/prop-types': 'off',
      'no-unused-vars': ['warn', { args: 'none', ignoreRestSiblings: true }],
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
]
