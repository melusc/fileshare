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

import {unlink} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

import {Router} from 'express';
import {render} from 'frontend';
import isPathInside from 'is-path-inside';
import multer from 'multer';

import {CustomPathIsTakenError, uploadFile} from '../api/file.ts';
import {uploadsDirectory} from '../constants.ts';
import {database, getUploads} from '../database.ts';
import {rateLimitGetStatic, rateLimitPost} from '../middleware/rate-limit.ts';
import {csrf, session} from '../middleware/token.ts';

export const uploadRouter: Router = Router();
export const multerMiddleware = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: 5e7, // 50 MB
	},
});

// Must not start with _ (reserve as an internal prefix)
const CUSTOM_PATH_VALIDATOR = /^[a-z\d\-. üöä,()][\w\-. üöä,()]{0,63}$/i;
const RESERVED_PATHS = new Set<string>([
	'login',
	'logout',
	'upload',
	'static',
	'api',
	// Potential future use
	'admin',
	'profile',
	'account',
	'settings',
	'config',
]);

uploadRouter.use(session.guard());

uploadRouter.get('/', rateLimitGetStatic(), async (_request, response) => {
	response.send(
		await render('upload', {
			session: response.locals.session,
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

		const body = (request.body ?? {}) as Record<string, unknown>;
		const {longid} = body;
		let customPath = body['custompath'] as string;

		if (
			typeof customPath !== 'string' ||
			(customPath && !CUSTOM_PATH_VALIDATOR.test(customPath.trim()))
		) {
			response.status(400).send(
				await render('upload', {
					session: response.locals.session,
					error: 'Invalid custom path.',
					csrfToken: csrf.generate(response),
					customPath: typeof customPath === 'string' ? customPath.trim() : '',
				}),
			);
			return;
		}

		customPath = customPath.trim();

		if (RESERVED_PATHS.has(customPath.toLowerCase())) {
			response.status(400).send(
				await render('upload', {
					session: response.locals.session,
					error: `${customPath} is reserved.`,
					csrfToken: csrf.generate(response),
					customPath: customPath,
				}),
			);
			return;
		}

		try {
			const {id} = await uploadFile(
				request.file,
				response.locals.session!.user,
				longid === 'on',
				customPath,
			);
			response.send(
				await render('upload', {
					session: response.locals.session,
					uploaded: id,
					csrfToken: csrf.generate(response),
				}),
			);
		} catch (error: unknown) {
			if (error instanceof CustomPathIsTakenError) {
				response.status(400).send(
					await render('upload', {
						session: response.locals.session,
						error: 'Custom path is already taken.',
						csrfToken: csrf.generate(response),
						customPath,
					}),
				);
				return;
			}

			throw error;
		}
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
					error: 'Missing ID.',
				}),
			);
			return;
		}

		const uploadPath = fileURLToPath(new URL(id, uploadsDirectory));
		if (!isPathInside(uploadPath, fileURLToPath(uploadsDirectory))) {
			response.redirect('/');
			return;
		}

		const sqlRow = database
			.prepare('SELECT author FROM uploads WHERE id = :id')
			.get({
				id,
			}) as
			| undefined
			| {
					author: string;
			  };

		if (sqlRow?.author !== response.locals.session!.user) {
			response.status(403).send(
				await render('index', {
					session: response.locals.session,
					uploads: getUploads(),
					csrfToken: csrf.generate(response),
					error: 'Not allowed to delete upload of other user.',
				}),
			);
			return;
		}

		try {
			database.prepare('DELETE FROM uploads WHERE id = :id;').run({
				id,
			});
			await unlink(uploadPath);
		} catch {
			// Do nothing, file doesn't exist
		}

		response.redirect('/');
	},
);
