import {timingSafeEqual} from 'node:crypto';

import express, {Router} from 'express';

import {database} from '../database.ts';
import {jwt} from '../session-token.ts';
import {scrypt} from '../util/promisified.ts';
import {render} from 'frontend';

export const loginRouter: Router = Router();

loginRouter.get('/', async (request, response) => {
	response.send(
		await render('login', {
			user: jwt.getUser(request),
			error: undefined,
		}),
	);
});

loginRouter.post(
	'/',
	express.urlencoded({extended: false}),
	async (request, response) => {
		const {username, password} = (request.body ?? {}) as Record<
			string,
			unknown
		>;

		if (typeof username !== 'string' || typeof password !== 'string') {
			response.status(400).send(
				await render('login', {
					user: jwt.getUser(request),
					error: 'Missing credentials.',
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
					user: jwt.getUser(request),
					error: 'Invalid credentials.',
				}),
			);
			return;
		}

		const {passwordSalt, passwordHash} = databaseResult;
		const requestHash = await scrypt(password, passwordSalt, 64);

		if (!timingSafeEqual(passwordHash, requestHash)) {
			response.status(400).send(
				await render('login', {
					user: jwt.getUser(request),
					error: 'Invalid credentials.',
				}),
			);
			return;
		}

		jwt.setCookie(username, response);
		response.redirect(302, '/');
	},
);
