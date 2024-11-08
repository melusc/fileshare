import {randomBytes} from 'node:crypto';

import type {RequestHandler, Response} from 'express';
import jwtProvider from 'jsonwebtoken';

const EXPIRY = 7;

class JWT {
	#secret = randomBytes(128);

	#sign(user: string) {
		return jwtProvider.sign({user}, this.#secret, {
			expiresIn: `${EXPIRY}d`,
		});
	}

	#verify(token: string): string | undefined {
		try {
			const decoded = jwtProvider.verify(token, this.#secret);
			return (decoded as {user: string}).user;
		} catch {
			return;
		}
	}

	setResponseLocals(): RequestHandler {
		return (request, response, next) => {
			const cookies = request.cookies as Record<string, string>;

			let user: string | undefined;

			if ('session' in cookies) {
				user = this.#verify(cookies['session']);
			}

			Object.defineProperty(response.locals, 'session', {
				value: user
					? {
							user,
						}
					: undefined,
			});
			next();
		};
	}

	guard(): RequestHandler {
		return (_request, response, next) => {
			if (response.locals.session) {
				next();
				return;
			}

			response.clearCookie('session', {
				httpOnly: true,
				secure: true,
			});

			response.redirect(302, '/login');
		};
	}

	setCookie(user: string, response: Response) {
		const expires = new Date();
		expires.setDate(expires.getDate() + EXPIRY);

		response.cookie('session', this.#sign(user), {
			httpOnly: true,
			secure: true,
			expires,
		});
	}
}

export const jwt = new JWT();
