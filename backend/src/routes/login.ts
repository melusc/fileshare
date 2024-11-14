import type {Buffer} from 'node:buffer';
import {timingSafeEqual} from 'node:crypto';

import express, {Router} from 'express';
import {render} from 'frontend';

import csrf from '../csrf.ts';
import {database} from '../database.ts';
import {rateLimitPost, rateLimitGetStatic} from '../middleware/rate-limit.ts';
import {jwt} from '../session-token.ts';
import {scrypt} from '../util/promisified.ts';

export const loginRouter: Router = Router();

loginRouter.get('/', rateLimitGetStatic(), async (_request, response) => {
	response.send(
		await render('login', {
			session: response.locals.session,
			error: undefined,
			csrfToken: csrf.generate(false),
		}),
	);
});

loginRouter.post(
	'/',
	rateLimitPost(),
	express.urlencoded({extended: false}),
	async (request, response) => {
		const {username, password, csrfToken} = (request.body ?? {}) as Record<
			string,
			unknown
		>;

		if (!csrf.validate(false, csrfToken)) {
			await render('login', {
				session: response.locals.session,
				error: 'Invalid CSRF token.',
				csrfToken: csrf.generate(false),
			});
			return;
		}

		if (typeof username !== 'string' || typeof password !== 'string') {
			response.status(400).send(
				await render('login', {
					session: response.locals.session,
					error: 'Missing credentials.',
					csrfToken: csrf.generate(false),
				}),
			);
			return;
		}

		const databaseResult = database
			.prepare<
				{username: string},
				{userId: string; passwordHash: Buffer; passwordSalt: Buffer}
			>('SELECT passwordHash, passwordSalt from logins where LOWER(username) = :username')
			.get({username: username.trim()});

		if (!databaseResult) {
			response.status(400).send(
				await render('login', {
					session: response.locals.session,
					error: 'Invalid credentials.',
					csrfToken: csrf.generate(false),
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
					csrfToken: csrf.generate(false),
				}),
			);
			return;
		}

		jwt.setCookie(username, response);
		response.redirect(302, '/');
	},
);
