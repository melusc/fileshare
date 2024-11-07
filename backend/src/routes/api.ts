import {readdir, unlink} from 'node:fs/promises';

import {Router} from 'express';

import {uploadsDirectory} from '../constants.ts';
import {jwt} from '../session-token.ts';

export const apiRouter: Router = Router();

apiRouter.get('/whoami', jwt.guard(true), (_request, response) => {
	if (response.locals['session'])
		response.json({
			loggedIn: true,
			username: response.locals['session'] as string,
		});
	else {
		response.json({
			loggedIn: false,
		});
	}
});

apiRouter.get('/files', jwt.guard(), async (_request, response) => {
	try {
		const list = await readdir(uploadsDirectory);
		response.json(list);
	} catch {
		response.status(500).json({
			error: 'Internal error',
		});
	}
});

apiRouter.delete('/file/:id', jwt.guard(), async (request, response) => {
	try {
		await unlink(new URL(request.params['id']!, uploadsDirectory));
		response.json({success: true});
	} catch {
		response.status(500).json({
			error: 'Internal error',
		});
	}
});
