import {randomBytes} from 'node:crypto';
import {readFile, unlink, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

import express, {Router} from 'express';
import {render} from 'frontend';
import isPathInside from 'is-path-inside';
import multer from 'multer';

import {uploadsDirectory} from '../constants.ts';
import csrf from '../csrf.ts';
import {database, getUploads} from '../database.ts';
import {rateLimitPost, rateLimitGetStatic} from '../middleware/rate-limit.ts';
import {jwt} from '../session-token.ts';

export const uploadRouter: Router = Router();
const multerMiddleware = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: 5e7, // 50 MB
	},
});

uploadRouter.use(jwt.guard());

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
			csrfToken: csrf.generate(response.locals.session!.user),
		}),
	);
	return;
});

uploadRouter.post(
	'/',
	rateLimitPost(),
	multerMiddleware.single('file'),
	async (request, response) => {
		const csrfToken = ((request.body ?? {}) as {csrfToken: string | undefined})
			.csrfToken;

		if (!csrf.validate(response.locals.session!.user, csrfToken)) {
			response.status(400).send(
				await render('upload', {
					session: response.locals.session,
					error: 'Invalid CSRF token.',
					csrfToken: csrf.generate(response.locals.session!.user),
				}),
			);
			return;
		}

		if (!request.file) {
			response.status(400).send(
				await render('upload', {
					session: response.locals.session,
					error: 'Missing file.',
					csrfToken: csrf.generate(response.locals.session!.user),
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
				await readFile(filePath);
				({id, filePath} = randomFileId(idLength));
			} catch {
				break;
			}
		}

		database
			.prepare<{id: string; author: string; date: string}>(
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

		response.redirect(`/${id}`);
	},
);

uploadRouter.post(
	'/delete',
	rateLimitPost(),
	jwt.guard(),
	express.urlencoded({extended: false}),
	async (request, response) => {
		const csrfToken = ((request.body ?? {}) as {csrfToken: string | undefined})
			.csrfToken;

		if (!csrf.validate(response.locals.session!.user, csrfToken)) {
			response.status(400).send(
				await render('index', {
					session: response.locals.session,
					uploads: getUploads(),
					csrfToken: csrf.generate(response.locals.session!.user),
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
					csrfToken: csrf.generate(response.locals.session!.user),
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
			database
				.prepare<{id: string}>('DELETE FROM uploads WHERE id = :id;')
				.run({
					id,
				});
			await unlink(new URL(id, uploadsDirectory));
		} catch {
			// Do nothing, file doesn't exist
		}

		response.redirect('/');
	},
);
