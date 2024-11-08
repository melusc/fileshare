import {readFile} from 'node:fs/promises';

export function svelteKitEngine(allowedVariables_: readonly string[]) {
	const allowedVariables = new Set(allowedVariables_);
	return async (
		path: string,
		options_: unknown,
		callback: (error: unknown, rendered?: string) => void,
	): Promise<void> => {
		const options = options_ as Record<string, unknown>;

		const variables = Object.entries(options)
			.filter(([key]) => allowedVariables.has(key))
			.map(([key, value]) => `${key}=${JSON.stringify(value)}`);

		try {
			const content = await readFile(path, 'utf8');
			const injected = content.replace('$vars$', variables.join(','));
			callback(null, injected);
		} catch (error: unknown) {
			callback(error);
		}
	};
}
