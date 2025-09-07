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

import {Router} from 'express';
import {render} from 'frontend';
import type {ApiToken, Session} from 'types';

import {uploadFile} from '../api/file.ts';
import {database} from '../database.ts';
import {
	rateLimitApi,
	rateLimitGetStatic,
	rateLimitPost,
} from '../middleware/rate-limit.ts';
import {csrf, session} from '../middleware/token.ts';

import {multerMiddleware} from './upload.ts';

export const apiRouter: Router = Router();

function getTokens(session: Session): readonly ApiToken[] {
	return database
		.prepare(
			`SELECT id, date, name FROM apiTokens
			WHERE owner = :owner`,
		)
		.all({
			owner: session.user,
		}) as ApiToken[];
}

apiRouter.get(
	'/',
	session.guard(),
	rateLimitGetStatic(),
	async (_request, response) => {
		const session = response.locals.session!;
		response.send(
			await render('api', {
				session: session,
				csrfToken: csrf.generate(response),
				apiTokens: getTokens(session),
			}),
		);
	},
);

apiRouter.post(
	'/',
	session.guard(),
	rateLimitPost(),
	multerMiddleware.none(),
	async (request, response) => {
		const session = response.locals.session!;

		if (!csrf.validate(request, response)) {
			response.status(400).send(
				await render('api', {
					session,
					csrfToken: csrf.generate(response),
					apiTokens: getTokens(session),
					error: 'Invalid CSRF token.',
				}),
			);
			return;
		}

		const {name} = (request.body ?? {}) as Record<string, unknown>;
		if (typeof name !== 'string' || !name) {
			response.status(400).send(
				await render('api', {
					session,
					csrfToken: csrf.generate(response),
					apiTokens: getTokens(session),
					error: 'Token Name is required.',
				}),
			);
			return;
		}

		const token = `fsa_${randomBytes(40).toString('base64url')}`.replaceAll(
			'-',
			'_',
		);
		const id = randomBytes(40).toString('base64url');

		database
			.prepare(
				`INSERT INTO apiTokens
			(id, name, owner, date, token)
		VALUES
			(:id, :name, :owner, :date, :token)`,
			)
			.run({
				id,
				name: name.trim().slice(0, 128),
				owner: session.user,
				date: new Date().toISOString(),
				token,
			});

		response.status(201).send(
			await render('api', {
				session,
				csrfToken: csrf.generate(response),
				apiTokens: getTokens(session),
				oneTimeShowToken: token,
			}),
		);
	},
);

apiRouter.post(
	'/token/revoke',
	session.guard(),
	rateLimitPost(),
	multerMiddleware.none(),
	async (request, response) => {
		const session = response.locals.session!;

		if (!csrf.validate(request, response)) {
			response.status(400).send(
				await render('api', {
					session,
					csrfToken: csrf.generate(response),
					apiTokens: getTokens(session),
					error: 'Invalid CSRF token.',
				}),
			);
			return;
		}

		const {id} = (request.body ?? {}) as Record<string, unknown>;

		if (typeof id !== 'string' || !id) {
			response.status(400).send(
				await render('api', {
					session,
					csrfToken: csrf.generate(response),
					apiTokens: getTokens(session),
					error: 'Missing ID.',
				}),
			);
			return;
		}

		database.prepare('DELETE FROM apiTokens WHERE id = :id').run({
			id,
		});

		response.redirect('/api');
	},
);

const v1 = Router();

apiRouter.use('/v1', v1);

v1.use(rateLimitApi(), (request, response, next) => {
	const token = request.header('Authorization')?.replace(/^bearer\s+/i, '');

	if (!token) {
		response.status(400).json({
			error: 'forbidden',
			message: 'Missing Authorization.',
		});
		return;
	}

	const owner = database
		.prepare('SELECT owner FROM apiTokens WHERE token = :token')
		.get({
			token,
		}) as {owner: string} | undefined;

	console.log({token});

	if (!owner) {
		response.status(403).json({
			error: 'forbidden',
			message: 'Invalid token.',
		});
		return;
	}

	const session = {
		user: owner.owner,
	} satisfies Session;
	Object.defineProperty(response.locals, 'session', {
		value: session,
	});

	next();
});

v1.use(
	'/upload',
	multerMiddleware.single('file'),
	async (request, response) => {
		if (!request.file) {
			response.status(400).json({
				error: 'missing-field',
				message: 'Missing file.',
			});
			return;
		}

		const {longid} = (request.body ?? {}) as Record<string, unknown>;
		const body = await uploadFile(
			request.file,
			response.locals.session!.user,
			longid !== 'false',
		);

		const protocol = request.header('x-forwarded-proto') || request.protocol;
		const host = request.header('x-forwarded-host') || request.host;
		const absoluteUrl = `${protocol}://${host}/${body.id}`;

		response.status(201).json({
			...body,
			url: absoluteUrl,
		});
	},
);
