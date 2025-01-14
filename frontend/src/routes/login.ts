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

export type ParametersLogin = {
	readonly error: string | undefined;
	readonly csrfToken: string;
};

export const RouteLogin = {
	title: 'Login',
	styles: ['form.css'],

	render({error, csrfToken}: ParametersLogin) {
		return form(
			[
				{
					label: 'Username',
					type: 'text',
					name: 'username',
				},
				{
					label: 'Password',
					type: 'password',
					name: 'password',
				},
			],
			'Login',
			csrfToken,
			error,
		);
	},
} satisfies Route;
