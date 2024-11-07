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

	#verify(token: string) {
		try {
			const decoded = jwtProvider.verify(token, this.#secret);
			return (decoded as {user: string}).user;
		} catch {
			return false;
		}
	}

	guard(allowLoggedOut = false): RequestHandler {
		return (request, response, next) => {
			const cookies = request.cookies as Record<string, string>;

			if ('session' in cookies) {
				const decoded = this.#verify(cookies['session']);

				if (decoded) {
					Object.defineProperty(response.locals, 'session', {
						value: decoded,
					});
					next();
					return;
				}
			}

			response.clearCookie('session', {
				httpOnly: true,
				secure: true,
			});

			if (allowLoggedOut) {
				Object.defineProperty(response.locals, 'session', {
					value: false,
				});
				next();
			} else {
				response.redirect(302, '/login');
			}
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
