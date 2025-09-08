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

import type {ApiToken} from 'types';

import {$} from '../$.js';
import type {Route} from '../route.js';

export type ParametersApi = {
	readonly apiTokens: readonly ApiToken[];
	readonly csrfToken: string;
	readonly error?: string;
	readonly oneTimeShowToken?: string;
};

export const RouteApi = {
	styles: ['api.css'],
	title: 'API',

	render({apiTokens, csrfToken, error, oneTimeShowToken}: ParametersApi) {
		const newTokenButton = $`<form
			class="form-new-token"
			action="/api"
			method="POST"
			enctype="multipart/form-data"
		>
			<input type="hidden" name="csrf-token" value="${csrfToken}" />
			<input
				class="border-theme"
				placeholder="Token Description"
				type="text"
				name="name"
				required />
			<input type="submit" class="button-new-token" value="New Token" />
		</form>`;

		const tableBody = apiTokens.map(
			({name, date, id}) => $`<div class="token-row">
			<div class="token-name">${name}</div>
			<time class="token-date" datetime="${date}">${date}</time>
			<form action="/api/token/revoke" method="POST" enctype="multipart/form-data">
				<input type="hidden" name="csrf-token" value="${csrfToken}" />
				<input type="submit" class="token-revoke" value="Revoke" />
				<input type="hidden" name="id" value="${id}" />
			</form>
		</div>`,
		);

		return $`<div class="api">
			${error && $`<div class="error">${error}</div>`}

			${newTokenButton}

			${
				oneTimeShowToken &&
				$`<div class="one-time-show-token">
				Please copy the token: <input type="text" value="${oneTimeShowToken}" />
			</div>`
			}

			${
				tableBody.length > 0 &&
				$`<div class="tokens-table">
				<div class="tokens-header font-bold">
					<div>Name</div>
					<div>Date created</div>
					<div>Revoke</div>
				</div>
				${tableBody}
			</div>`
			}
		</div>`;
	},
} satisfies Route;
