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

import {Buffer} from 'node:buffer';
import {randomBytes} from 'node:crypto';
import {readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';

import {fileTypeFromBuffer} from 'file-type';

import {uploadsDirectory} from '../constants.ts';
import {database} from '../database.ts';

function randomFileId(idLength: number) {
	const id = randomBytes(idLength).toString('base64url');
	return {
		id,
		filePath: new URL(id, uploadsDirectory),
	};
}

export async function uploadFile(
	file: Express.Multer.File,
	author: string,
	longId: boolean,
) {
	let id: string;
	let filePath: URL;

	const idLength = longId ? 32 : 4;

	do {
		({id, filePath} = randomFileId(idLength));

		try {
			// eslint-disable-next-line security/detect-non-literal-fs-filename
			await readFile(filePath);
		} catch {
			break;
		}
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, no-constant-condition
	} while (true);

	const mime = await fileTypeFromBuffer(file.buffer);
	let filename = file.originalname.trim();
	try {
		// multer uses latin1 encoding
		filename = Buffer.from(filename, 'latin1').toString('utf8');
	} catch {}
	filename &&= path.basename(filename);

	const body = {
		id,
		author,
		date: new Date().toISOString(),
		mime: mime?.mime ?? null,
		// Turn empty string into null
		filename: filename || null,
	};

	database
		.prepare(
			`INSERT INTO uploads
					(id, author, date, mime, filename)
					values
					(:id, :author, :date, :mime, :filename);
				`,
		)
		.run(body);

	// eslint-disable-next-line security/detect-non-literal-fs-filename
	await writeFile(filePath, file.buffer);

	return body;
}
