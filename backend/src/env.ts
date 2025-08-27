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
import process from 'node:process';

const envPort = Number.parseInt(process.env['BIND_PORT']!, 10);
const port = Number.isSafeInteger(envPort) ? envPort : 3178;
const host = process.env['BIND_HOST'] ?? '127.0.0.1';

const socketPath = process.env['BIND_SOCKET'];

const sessionSecret = process.env['SESSION_SECRET'] ?? randomBytes(128);

const env = {
	port,
	host,
	socketPath,
	sessionSecret,
};
export default env;
