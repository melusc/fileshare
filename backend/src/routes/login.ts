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

import type {Buffer} from 'node:buffer';
import {timingSafeEqual} from 'node:crypto';

import {RelativeUrl} from '@lusc/util/relative-url';
import {Router} from 'express';
import {render} from 'frontend';
import multer from 'multer';

import {database} from '../database.ts';
import {rateLimitPost, rateLimitGetStatic} from '../middleware/rate-limit.ts';
import {csrf, session} from '../middleware/token.ts';
import {scrypt} from '../util/promisified.ts';

export const loginRouter: Router = Router();

const multerMiddleware = multer({
	storage: multer.memoryStorage(),
});

loginRouter.get('/', rateLimitGetStatic(), async (_request, response) => {
	response.send(
		await render('login', {
			session: response.locals.session,
			error: undefined,
			csrfToken: csrf.generate(response),
		}),
	);
});

loginRouter.post(
	'/',
	rateLimitPost(),
	multerMiddleware.none(),
	async (request, response) => {
		const {username, password} = (request.body ?? {}) as Record<
			string,
			unknown
		>;

		if (!csrf.validate(request, response)) {
			response.status(400).send(
				await render('login', {
					session: response.locals.session,
					error: 'Invalid CSRF token.',
					csrfToken: csrf.generate(response),
				}),
			);
			return;
		}

		if (typeof username !== 'string' || typeof password !== 'string') {
			response.status(400).send(
				await render('login', {
					session: response.locals.session,
					error: 'Missing credentials.',
					csrfToken: csrf.generate(response),
				}),
			);
			return;
		}

		const databaseResult = database
			.prepare(
				'SELECT passwordHash, passwordSalt from logins where LOWER(username) = :username',
			)
			.get({username: username.trim()}) as
			| {userId: string; passwordHash: Buffer; passwordSalt: Buffer}
			| undefined;

		if (!databaseResult) {
			response.status(400).send(
				await render('login', {
					session: response.locals.session,
					error: 'Invalid credentials.',
					csrfToken: csrf.generate(response),
				}),
			);
			return;
		}

		const {passwordSalt, passwordHash} = databaseResult;
		const requestHash = await scrypt(password, passwordSalt, 64);

		if (!timingSafeEqual(passwordHash, requestHash)) {
			response.status(400).send(
				await render('login', {
					session: response.locals.session,
					error: 'Invalid credentials.',
					csrfToken: csrf.generate(response),
				}),
			);
			return;
		}

		session.setCookie(username, response);
		const {searchParams} = new RelativeUrl(request.originalUrl);
		const redirectUrl = new RelativeUrl(searchParams.get('next') ?? '/');
		response.redirect(302, redirectUrl.href);
	},
);
