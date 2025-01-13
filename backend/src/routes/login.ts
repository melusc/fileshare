import type {Buffer} from 'node:buffer';
import {timingSafeEqual} from 'node:crypto';

import {Router} from 'express';
import {render} from 'frontend';
import multer from 'multer';

import {database} from '../database.ts';
import {rateLimitPost, rateLimitGetStatic} from '../middleware/rate-limit.ts';
import {csrf, CsrfFormType, session} from '../middleware/token.ts';
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
			csrfToken: csrf.generate(CsrfFormType.login),
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

		if (!csrf.validate(CsrfFormType.login, request)) {
			response.status(400).send(
				await render('login', {
					session: response.locals.session,
					error: 'Invalid CSRF token.',
					csrfToken: csrf.generate(CsrfFormType.login),
				}),
			);
			return;
		}

		if (typeof username !== 'string' || typeof password !== 'string') {
			response.status(400).send(
				await render('login', {
					session: response.locals.session,
					error: 'Missing credentials.',
					csrfToken: csrf.generate(CsrfFormType.login),
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
					csrfToken: csrf.generate(CsrfFormType.login),
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
					csrfToken: csrf.generate(CsrfFormType.login),
				}),
			);
			return;
		}

		session.setCookie(username, response);
		response.redirect(302, '/');
	},
);
