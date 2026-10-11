// ESLint loads this file in preference to eslint.config.mjs. Keep both: n8n-node's
// strict mode requires the default eslint.config.mjs to exist, while this one adds
// the ignores that keep vitest test files (which n8n Cloud would reject) out of lint.

const { config } = require('@n8n/node-cli/eslint');

const baseConfig = Array.isArray(config) ? config : [config];

module.exports = [
	{ ignores: ['**/__tests__/**', 'vitest.config.ts'] },
	...baseConfig,
];
