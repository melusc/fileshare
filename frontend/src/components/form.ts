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

import {$} from '../$.js';

export function form(
	inputs: ReadonlyArray<{
		label: string;
		name: string;
		type: 'checkbox' | 'text' | 'file' | 'password' | 'hidden';
		value?: string;
	}>,
	submitLabel: string,
	csrfToken: string,
	uploadError: string | undefined,
) {
	return $`
${uploadError && $`<div class="error">${uploadError}</div>`}

<form method="POST" enctype="multipart/form-data">
	${inputs.map(
		({label, type, name, value}) => $`
		${type !== 'hidden' && $`<label for="${name}">${label}</label>`}
		<input
			type="${type}"
			name="${name}"
			id="${name}"
			${typeof value === 'string' && $`value="${value}"`}
			${type !== 'checkbox' && 'required'}
		/>
	`,
	)}

	<input type="hidden" name="csrf-token" value="${csrfToken}" />
	<input type="submit" name="submit" class="submit" value="${submitLabel}" />
</form>`;
}
