import {timingSafeEqual} from 'node:crypto';

import express, {Router} from 'express';

import {staticRoot} from '../constants.ts';
import {database} from '../database.ts';
import {jwt} from '../session-token.ts';
import {scrypt} from '../util/promisified.ts';

export const loginRouter: Router = Router();

loginRouter.get('/', (_request, response) => {
	response.sendFile('login.html', {
		root: staticRoot,
	});
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
			response.sendFile('login.html', {
				root: staticRoot,
			});
			return;
		}

		const databaseResult = database
			.prepare<
				{username: string},
				{userId: string; passwordHash: Buffer; passwordSalt: Buffer}
			>('SELECT passwordHash, passwordSalt from logins where LOWER(username) = :username')
			.get({username: username.trim()});

		if (!databaseResult) {
			response.sendFile('login.html', {
				root: staticRoot,
			});
			return;
		}

		const {passwordSalt, passwordHash} = databaseResult;
		const requestHash = await scrypt(password, passwordSalt, 64);

		if (!timingSafeEqual(passwordHash, requestHash)) {
			response.sendFile('login.html', {
				root: staticRoot,
			});
			return;
		}

		jwt.setCookie(username, response);
		response.redirect(302, '/');
	},
);
