import {randomBytes} from 'node:crypto';

import type {Request, RequestHandler, Response} from 'express';
import jwtProvider from 'jsonwebtoken';

const EXPIRY = 7;
const RENEWAL_TIME = 24 * 60 * 60; // 1 day

class JWT {
	#secret = randomBytes(128);

	#sign(user: string) {
		return jwtProvider.sign({user}, this.#secret, {
			expiresIn: `${EXPIRY}d`,
		});
	}

	#verify(request: Request): string | undefined {
		const cookies = request.cookies as Record<string, string>;
		const sessionCookie = cookies['session'];

		if (!sessionCookie) {
			return;
		}

		try {
			const decoded = jwtProvider.verify(sessionCookie, this.#secret);
			return (decoded as {user: string}).user;
		} catch {
			return;
		}
	}

	responseLocalsMiddleware(): RequestHandler {
		return (request, response, next) => {
			const user = this.#verify(request);

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

	cookieRenewalMiddleware(): RequestHandler {
		return (request, response, next) => {
			if (!this.#verify(request)) {
				next();
				return;
			}

			const cookies = request.cookies as Record<string, string>;
			const sessionCookie = cookies['session'];

			const {user, exp} = jwtProvider.decode(sessionCookie!) as {
				exp: number;
				user: string;
			};
			const now = Math.floor(Date.now() / 1000);

			if (exp > now && exp - now < RENEWAL_TIME) {
				this.setCookie(user, response);
			}

			next();
		};
	}

	guard(): RequestHandler {
		return (request, response, next) => {
			if (this.#verify(request)) {
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
