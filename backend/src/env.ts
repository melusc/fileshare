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

import {randomBytes} from 'node:crypto';
import process, {exit} from 'node:process';

const envPort = Number.parseInt(process.env['FILESHARE_BIND_PORT']!, 10);
const port = Number.isSafeInteger(envPort) ? envPort : 3178;
const host = process.env['FILESHARE_BIND_HOST'] ?? '127.0.0.1';

const socketPath = process.env['FILESHARE_BIND_SOCKET'];

const sessionSecret =
	process.env['FILESHARE_SESSION_SECRET'] ?? randomBytes(128);

const baseUrl = process.env['FILESHARE_BASE_URL'];

if (!baseUrl) {
	console.error('FILESHARE_BASE_URL is required to be set!');
	exit(1);
}

const env = {
	port,
	host,
	socketPath,
	sessionSecret,
	baseUrl,
};
export default env;
