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
import {readFile, unlink, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {Router} from 'express';
import {fileTypeFromBuffer} from 'file-type';
import {render} from 'frontend';
import isPathInside from 'is-path-inside';
import multer from 'multer';

import {uploadsDirectory} from '../constants.ts';
import {database, getUploads} from '../database.ts';
import {rateLimitPost, rateLimitGetStatic} from '../middleware/rate-limit.ts';
import {session, csrf} from '../middleware/token.ts';

export const uploadRouter: Router = Router();
const multerMiddleware = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: 5e7, // 50 MB
	},
});

uploadRouter.use(session.guard());

function randomFileId(idLength: number) {
	const id = randomBytes(idLength).toString('base64url');
	return {
		id: id,
		filePath: new URL(id, uploadsDirectory),
	};
}

uploadRouter.get('/', rateLimitGetStatic(), async (_request, response) => {
	response.send(
		await render('upload', {
			session: response.locals.session,
			error: undefined,
			csrfToken: csrf.generate(response),
		}),
	);
	return;
});

uploadRouter.post(
	'/',
	rateLimitPost(),
	multerMiddleware.single('file'),
	async (request, response) => {
		if (!csrf.validate(request, response)) {
			response.status(400).send(
				await render('upload', {
					session: response.locals.session,
					error: 'Invalid CSRF token.',
					csrfToken: csrf.generate(response),
				}),
			);
			return;
		}

		if (!request.file) {
			response.status(400).send(
				await render('upload', {
					session: response.locals.session,
					error: 'Missing file.',
					csrfToken: csrf.generate(response),
				}),
			);
			return;
		}

		const {longid} = (request.body ?? {}) as Record<string, unknown>;

		const idLength = longid === 'on' ? 32 : 4;
		let {id, filePath} = randomFileId(idLength);

		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		while (true) {
			try {
				// eslint-disable-next-line security/detect-non-literal-fs-filename
				await readFile(filePath);
				({id, filePath} = randomFileId(idLength));
			} catch {
				break;
			}
		}

		const mime = await fileTypeFromBuffer(request.file.buffer);
		let filename = request.file.originalname.trim();
		try {
			// multer uses latin1 encoding
			filename = Buffer.from(filename, 'latin1').toString('utf8');
		} catch {}
		filename &&= path.basename(filename);

		database
			.prepare(
				`INSERT INTO uploads
				(id, author, date, mime, filename)
				values
				(:id, :author, :date, :mime, :filename);
			`,
			)
			.run({
				id,
				author: response.locals.session!.user,
				date: new Date().toISOString(),
				mime: mime?.mime ?? null,
				// Turn empty string into null
				filename: filename || null,
			});

		// eslint-disable-next-line security/detect-non-literal-fs-filename
		await writeFile(filePath, request.file.buffer);

		response.redirect(`/${id}`);
	},
);

uploadRouter.post(
	'/delete',
	rateLimitPost(),
	multerMiddleware.none(),
	async (request, response) => {
		if (!csrf.validate(request, response)) {
			response.status(400).send(
				await render('index', {
					session: response.locals.session,
					uploads: getUploads(),
					csrfToken: csrf.generate(response),
					error: 'Invalid CSRF token.',
				}),
			);
			return;
		}

		const {id} = (request.body ?? {}) as Record<string, unknown>;

		if (typeof id !== 'string') {
			response.status(400).send(
				await render('index', {
					session: response.locals.session,
					uploads: getUploads(),
					csrfToken: csrf.generate(response),
					error: 'Missing id.',
				}),
			);
			return;
		}

		const uploadPath = fileURLToPath(new URL(id, uploadsDirectory));
		if (!isPathInside(uploadPath, fileURLToPath(uploadsDirectory))) {
			response.redirect('/');
			return;
		}

		try {
			database.prepare('DELETE FROM uploads WHERE id = :id;').run({
				id,
			});
			// eslint-disable-next-line security/detect-non-literal-fs-filename
			await unlink(uploadPath);
		} catch {
			// Do nothing, file doesn't exist
		}

		response.redirect('/');
	},
);
