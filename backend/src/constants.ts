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

import {mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

const dataDirectory = new URL('../data/', import.meta.url);
export const uploadsDirectory = new URL('uploads/', dataDirectory);

// eslint-disable-next-line security/detect-non-literal-fs-filename
await mkdir(uploadsDirectory, {recursive: true});
export const databasePath = new URL('database.db', dataDirectory);

export const staticRoot = fileURLToPath(import.meta.resolve('frontend/static'));
