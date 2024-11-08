import {unlink} from 'node:fs/promises';

import {Router} from 'express';

import {uploadsDirectory} from '../constants.ts';
import {jwt} from '../session-token.ts';

export const apiRouter: Router = Router();

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
