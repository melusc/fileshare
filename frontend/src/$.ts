/*!
	This program is free software: you can redistribute it
	and/or modify it under the terms of the GNU General Public
	License as published by the Free Software Foundation,
	either version 3 of the License, or (at your option)
	any later version.

	This program is distributed in the hope that it will be
	useful, but WITHOUT ANY WARRANTY; without even the implied
	warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR
	PURPOSE. See the GNU General Public License for more details.

	You should have received a copy of the GNU General Public
	License along with this program. If not, see <https://www.gnu.org/licenses/>.
*/

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
