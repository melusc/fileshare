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

import type {Request, RequestHandler, Response} from 'express';
import jwtProvider from 'jsonwebtoken';
// eslint-disable-next-line n/no-extraneous-import
import type {StringValue} from 'ms';

class Token<T extends Record<string, unknown>> {
	// Separate secret per type
	// Implicitly prevents csrf tokens
	// being passed as session token
	// (in addition to audience)
	#secret = randomBytes(128);

	constructor(
		private readonly audience: string,
		private readonly expiry: StringValue,
	) {}

	protected sign(json: T) {
		return jwtProvider.sign(json, this.#secret, {
			expiresIn: this.expiry,
			audience: this.audience,
		});
	}

	protected verify(token: string | undefined): (T & {exp: number}) | false {
		if (typeof token !== 'string') {
			return false;
		}

		try {
			const payload = jwtProvider.verify(token, this.#secret, {
				audience: this.audience,
			}) as T & {exp: number};

			return payload;
		} catch {
			return false;
		}
	}
}

class Session extends Token<{user: string}> {
	static #EXPIRY_DAYS = 7;
	static #RENEWAL_SECONDS = 24 * 60 * 60;

	constructor() {
		super('fileshare/session', `${Session.#EXPIRY_DAYS} days`);
	}

	#verifyRequest(request: Request) {
		const cookies = request.cookies as Record<string, string>;
		const sessionCookie = cookies['session'] as string;
		return super.verify(sessionCookie);
	}

	middleware(): RequestHandler {
		return (request, response, next) => {
			const jwtPayload = this.#verifyRequest(request);

			if (!jwtPayload) {
				next();
				return;
			}

			Object.defineProperty(response.locals, 'session', {
				value: {
					user: jwtPayload.user,
				},
			});

			const {exp} = jwtPayload;
			const now = Math.floor(Date.now() / 1000);

			if (exp > now && exp - now < Session.#RENEWAL_SECONDS) {
				this.setCookie(jwtPayload.user, response);
			}

			next();
		};
	}

	guard(): RequestHandler {
		return (request, response, next) => {
			if (this.#verifyRequest(request)) {
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
		expires.setDate(expires.getDate() + Session.#EXPIRY_DAYS);

		response.cookie('session', this.sign({user}), {
			httpOnly: true,
			secure: true,
			expires,
		});
	}
}

export const session = new Session();

export const enum CsrfFormType {
	uploadDelete,
	uploadCreate,
	login,
}
class Csrf extends Token<{form: CsrfFormType}> {
	constructor() {
		super('fileshare/csrf', '15 min');
	}

	generate(form: CsrfFormType) {
		return this.sign({form});
	}

	validate(form: CsrfFormType, request: Request): boolean {
		const body = (request.body ?? {}) as Record<string, string>;
		const token = body['csrf-token'];

		const jwtPayload = this.verify(token);
		return jwtPayload && jwtPayload.form === form;
	}
}

export const csrf = new Csrf();
