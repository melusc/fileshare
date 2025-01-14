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

import type {Session} from 'types';

import {$} from '../$.js';

export function header(session: Session | undefined) {
	return $`
<header>
	<a href="/">
		<h1>Home</h1>
	</a>
	<a href="/upload">
		<h1>Upload</h1>
	</a>

	<a class="login" href="${session ? '/logout' : '/login'}">
		${session ? 'Log out' : 'Log in'}
	</a>
</header>`;
}
