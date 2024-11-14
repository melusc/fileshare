import {randomBytes} from 'node:crypto';

type CsrfEntry = {
	user: string | false;
	expiry: Date;
};

const EXPIRY_MINUTES = 15;

class CSRF {
	#tokens = new Map<string, CsrfEntry>();

	generate(user: string | false) {
		const token = randomBytes(64).toString('base64url');
		const expiry = new Date();
		expiry.setMinutes(expiry.getMinutes() + EXPIRY_MINUTES);

		this.#tokens.set(token, {
			user,
			expiry,
		});

		return token;
	}

	validate(user: string | false, token: unknown) {
		if (typeof token !== 'string') {
			return false;
		}

		const entry = this.#tokens.get(token);
		// use once only
		this.#tokens.delete(token);

		if (!entry) {
			return false;
		}

		if (entry.user !== false && entry.user !== user) {
			return false;
		}

		return entry.expiry.getTime() > Date.now();
	}
}

const csrf = new CSRF();

export default csrf;
