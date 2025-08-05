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

import {form} from '../components/form.js';
import type {Route} from '../route.js';

export type ParametersUpload = {
	readonly error: string | undefined;
	readonly csrfToken: string;
};

export const RouteUpload = {
	title: 'Upload',
	styles: ['form.css'],

	render({error, csrfToken}: ParametersUpload) {
		return form(
			[
				{
					name: 'file',
					label: 'File',
					type: 'file',
				},
				{
					name: 'longid',
					label: 'Use long id',
					type: 'checkbox',
				},
			],
			'Upload',
			csrfToken,
			error,
		);
	},
} satisfies Route;
