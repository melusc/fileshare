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

import type {Upload} from 'types';

import {$} from '../$.js';
import type {Route} from '../route.js';

export type ParametersIndex = {
	readonly uploads: readonly Upload[];
	readonly error?: string;
	readonly csrfToken: string;
};

export const RouteIndex = {
	styles: ['index.css'],
	title: undefined,

	render({uploads, error, csrfToken}: ParametersIndex) {
		if (uploads.length === 0) {
			return $`
				<div class="uploads">
					<a href="/upload">Upload your first file</a>
				</div>
			`;
		}

		const tableBody = uploads.map(
			({id, author, date, mime}) => $`
				<div class="upload-entry">
					<a class="upload-link" href="/${id}">${id}</a>
					<div class="upload-mime">${mime ?? ''}</div>
					<div class="upload-author">${author}</div>
					<time class="upload-date" datetime="${date}">${date}</time>
					<form action="/upload/delete" method="POST" enctype="multipart/form-data">
						<input name="id" value="${id}" type="hidden">
						<input name="csrf-token" value="${csrfToken}" type="hidden">
						<input class="upload-delete" type="submit" value="Delete">
					</form>
				</div>`,
		);

		return $`
			<div class="uploads">
				${error && $`<div class="error">${error}</div>`}
				<div class="uploads-title">
					<div>ID</div>
					<div>Type</div>
					<div>Author</div>
					<div>Date</div>
					<div>Delete Upload</div>
				</div>
				${tableBody}
			</div>`;
	},
} satisfies Route;
