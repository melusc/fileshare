import config from '@lusc/eslint-config';

export default [
	...config,
	{
		rules: {
			'unicorn/name-replacements': [
				'error',
				{
					replacements: {
						env: false,
					},
				},
			],
			'unicorn/no-top-level-side-effects': 'off',
		},
	},
];
