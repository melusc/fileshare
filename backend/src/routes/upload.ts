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
import {readFile, unlink, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

import {Router} from 'express';
import {render} from 'frontend';
import isPathInside from 'is-path-inside';
import multer from 'multer';

import {uploadsDirectory} from '../constants.ts';
import {database, getUploads} from '../database.ts';
import {rateLimitPost, rateLimitGetStatic} from '../middleware/rate-limit.ts';
import {session, csrf, CsrfFormType} from '../middleware/token.ts';

export const uploadRouter: Router = Router();
const multerMiddleware = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: 5e7, // 50 MB
	},
});

// Avoid double submit
// Double Submit Token -> upload id
const doubleSubmitTokens = new Map<string, string>();

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
			csrfToken: csrf.generate(CsrfFormType.uploadCreate),
		}),
	);
	return;
});

uploadRouter.post(
	'/',
	rateLimitPost(),
	multerMiddleware.single('file'),
	async (request, response) => {
		if (!csrf.validate(CsrfFormType.uploadCreate, request)) {
			response.status(400).send(
				await render('upload', {
					session: response.locals.session,
					error: 'Invalid CSRF token.',
					csrfToken: csrf.generate(CsrfFormType.uploadCreate),
				}),
			);
			return;
		}

		if (!request.file) {
			response.status(400).send(
				await render('upload', {
					session: response.locals.session,
					error: 'Missing file.',
					csrfToken: csrf.generate(CsrfFormType.uploadCreate),
				}),
			);
			return;
		}

		const {longid, 'submit-token': submitToken} = (request.body ??
			{}) as Record<string, unknown>;

		// It is not that serious, no need to 400 if token isn't passed along
		if (
			typeof submitToken === 'string' &&
			doubleSubmitTokens.has(submitToken)
		) {
			const id = doubleSubmitTokens.get(submitToken)!;
			response.redirect(`/${id}`);
			return;
		}

		const idLength = longid === 'on' ? 32 : 4;
		let {id, filePath} = randomFileId(idLength);

		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		while (true) {
			try {
				await readFile(filePath);
				({id, filePath} = randomFileId(idLength));
			} catch {
				break;
			}
		}

		database
			.prepare(
				`INSERT INTO uploads
				(id, author, date)
				values
				(:id, :author, :date);
			`,
			)
			.run({
				id,
				author: response.locals.session!.user,
				date: new Date().toISOString(),
			});

		await writeFile(filePath, request.file.buffer);

		if (typeof submitToken === 'string') {
			doubleSubmitTokens.set(submitToken, id);
		}
		response.redirect(`/${id}`);
	},
);

uploadRouter.post(
	'/delete',
	rateLimitPost(),
	multerMiddleware.none(),
	async (request, response) => {
		if (!csrf.validate(CsrfFormType.uploadDelete, request)) {
			response.status(400).send(
				await render('index', {
					session: response.locals.session,
					uploads: getUploads(),
					csrfToken: csrf.generate(CsrfFormType.uploadDelete),
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
					csrfToken: csrf.generate(CsrfFormType.uploadDelete),
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
			await unlink(new URL(id, uploadsDirectory));
		} catch {
			// Do nothing, file doesn't exist
		}

		response.redirect('/');
	},
);
