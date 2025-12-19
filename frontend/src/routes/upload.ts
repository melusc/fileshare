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
import {form} from '../components/form.js';
import type {Route} from '../route.js';

export type ParametersUpload = {
	readonly error?: string;
	readonly csrfToken: string;
	readonly uploaded?: string;
};

export const RouteUpload = {
	title: 'Upload',
	styles: ['form.css', 'upload.css'],

	render({error, csrfToken, uploaded}: ParametersUpload) {
		return $`
			<div>
				${
					uploaded !== undefined &&
					$`
					<div class="upload-link">Uploaded to <a href="/${uploaded}">${uploaded}</a></div>

					<h2>Upload another file</h2>
				`
				}

				${form(
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
				)}
			</div>`;
	},
} satisfies Route;
