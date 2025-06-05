import config from '@lusc/eslint-config';

export default [
	...config,
	{
		rules: {
			'unicorn/prevent-abbreviations': [
				'error',
				{
					allowList: {
						env: true,
					},
				},
			],
		},
	},
];
