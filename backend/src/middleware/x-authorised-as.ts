/*!
	Copyright 2026 Luca Schnellmann <oss@lusc.ch>

	This file is part of recipe-store.

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

import type {RequestHandler} from 'express';

import env from '../env.ts';

export function loginFromXAuthorisedAs(): RequestHandler {
	// eslint-disable-next-line unicorn/consistent-function-scoping
	return (request, response, next) => {
		if (!env.enableXAuthorisedAs) {
			next();
			return;
		}

		const xAuthorisedAs = request.header('X-Authorised-As');
		if (!xAuthorisedAs) {
			next();
			return;
		}

		if (xAuthorisedAs) {
			Object.defineProperty(response.locals, 'session', {
				value: {
					user: xAuthorisedAs,
				},
				writable: false,
				configurable: false,
			});
		}

		next();
	};
}
