import {randomBytes} from 'node:crypto';

import type {Request, RequestHandler, Response} from 'express';
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

	guard(): RequestHandler {
		return (request, response, next) => {
			const user = this.getUser(request);

			if (user) {
				Object.defineProperty(response.locals, 'session', {
					value: user,
				});
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

	getUser(request: Request): string | undefined {
		const cookies = request.cookies as Record<string, string>;

		if ('session' in cookies) {
			const decoded = this.#verify(cookies['session']);

			return decoded;
		}

		return;
	}
}

export const jwt = new JWT();
