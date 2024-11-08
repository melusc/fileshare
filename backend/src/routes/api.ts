import {unlink} from 'node:fs/promises';

import {Router} from 'express';

import {uploadsDirectory} from '../constants.ts';
import {jwt} from '../session-token.ts';
import {database} from '../database.ts';

export const apiRouter: Router = Router();

apiRouter.delete('/file/:id', jwt.guard(), async (request, response) => {
	try {
		const id = request.params['id']!;
		await unlink(new URL(id, uploadsDirectory));
		database
			.prepare<{id: string}>(
				`DELETE FROM uploads
				WHERE id = :id;`,
			)
			.run({
				id,
			});
		response.json({success: true});
	} catch {
		response.status(500).json({
			error: 'Internal error',
		});
	}
});
