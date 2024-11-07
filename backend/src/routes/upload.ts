import {randomBytes} from 'node:crypto';
import {readFile, writeFile} from 'node:fs/promises';

import {Router} from 'express';
import multer from 'multer';

import {staticRoot, uploadsDirectory} from '../constants.ts';
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

uploadRouter.get('/', (_request, response) => {
	response.sendFile('upload.html', {
		root: staticRoot,
	});
});

uploadRouter.post(
	'/',
	multerMiddleware.single('file'),
	async (request, response) => {
		if (!request.file) {
			response.sendFile('upload.html', {
				root: staticRoot,
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

		await writeFile(filePath, request.file.buffer);

		response.redirect(`/${id}`);
	},
);
