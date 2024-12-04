import he from 'he';

export type Substitution =
	| string
	| SafeString
	| ReadonlyArray<SafeString>
	| boolean
	| undefined;

export class SafeString {
	constructor(private content: string) {}

	render() {
		return this.content.trim().replaceAll(/\s+/g, ' ');
	}
}

export function $(
	template: readonly string[],
	...substitutions: readonly Substitution[]
): SafeString {
	const result: string[] = [];

	for (const [index, templateItem] of template.entries()) {
		if (index > 0) {
			const substitution = substitutions[index - 1];
			if (typeof substitution === 'string') {
				result.push(he.encode(substitution));
			} else if (substitution instanceof SafeString) {
				result.push(substitution.render());
			} else if (
				typeof substitution === 'boolean' ||
				substitution === undefined
			) {
				// Do nothing
			} else {
				result.push(substitution.map(s => s.render()).join('\n'));
			}
		}

		result.push(templateItem);
	}

	return new SafeString(result.join(''));
}
