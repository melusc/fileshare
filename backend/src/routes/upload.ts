import {randomBytes} from 'node:crypto';
import {readFile, writeFile} from 'node:fs/promises';

import {Router} from 'express';
import multer from 'multer';

import {uploadsDirectory} from '../constants.ts';
import {jwt} from '../session-token.ts';
import {database} from '../database.ts';

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

uploadRouter.get('/', (request, response) => {
	response.render('upload', {
		loggedInUser: jwt.getUser(request),
		formState: {
			error: null,
		},
	});
});

uploadRouter.post(
	'/',
	multerMiddleware.single('file'),
	async (request, response) => {
		if (!request.file) {
			response.render('upload', {
				loggedInUser: jwt.getUser(request),
				formState: {
					error: 'Missing file.',
				},
			});
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
				author: response.locals['session'] as string,
				date: new Date().toISOString(),
			});

		await writeFile(filePath, request.file.buffer);

		response.redirect(`/${id}`);
	},
);
