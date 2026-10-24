import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import prettier from 'eslint-config-prettier';

// All colour values live in src/styles/tokens.css, so none may appear in TSX.
// This is a real rule rather than a no-restricted-syntax selector: esquery
// selectors cannot contain "]" inside a regex, so a hex-matching selector
// silently never fires.
const HEX_COLOUR = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![0-9a-zA-Z_-])/;

const swo = {
  rules: {
    'no-raw-colour': {
      meta: {
        type: 'problem',
        schema: [],
        messages: {
          hex: 'Raw hex colour "{{ text }}". Use a semantic token from src/styles/tokens.css (e.g. text-text-primary).',
        },
      },
      create(context) {
        const check = (node, text) => {
          const match = HEX_COLOUR.exec(text);
          if (match) context.report({ node, messageId: 'hex', data: { text: match[0] } });
        };
        return {
          Literal(node) {
            if (typeof node.value === 'string') check(node, node.value);
          },
          TemplateElement(node) {
            check(node, node.value.raw);
          },
        };
      },
    },
  },
};

// Palette tokens are raw values; only the semantic layer may be used by components.
// (The dev showcase is exempt because displaying the palette is its job.)
const noPaletteInComponents = [
  {
    selector: 'Literal[value=/palette-/]',
    message: 'Palette tokens are raw values. Components must use semantic tokens only.',
  },
];

export default tseslint.config(
  {
    ignores: [
      'dist',
      'node_modules',
      'references',
      'public',
      'tracking',
      'docs/evidence',
      'tests/fixtures',
      '.claude',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  jsxA11y.flatConfigs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { swo },
    rules: { 'swo/no-raw-colour': 'error' },
  },
  {
    files: ['src/components/**/*.{ts,tsx}'],
    rules: { 'no-restricted-syntax': ['error', ...noPaletteInComponents] },
  },
  prettier,
);
