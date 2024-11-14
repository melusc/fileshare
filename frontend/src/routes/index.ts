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
			({id, author, date}) => $`
				<div class="upload-entry">
					<a class="upload-link" href="/${id}">${id}</a>
					<div class="upload-author">${author}</div>
					<time class="upload-date" datetime="${date}">${date}</time>
					<form action="/upload/delete" method="POST">
						<input name="id" value="${id}" type="hidden">
						<input name="csrfToken" value="${csrfToken}" type="hidden">
						<input class="upload-delete" type="submit" value="Delete">
					</form>
				</div>`,
		);

		return $`
			<div class="uploads">
				${error && $`<div class="error">${error}</div>`}
				<div class="uploads-title">
					<div>ID</div>
					<div>Author</div>
					<div>Date</div>
					<div>Delete Upload</div>
				</div>
				${tableBody}
			</div>`;
	},
} satisfies Route;
