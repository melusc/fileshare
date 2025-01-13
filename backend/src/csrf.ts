import {randomBytes} from 'node:crypto';

const EXPIRY_MINUTES = 15;

class CSRF {
	#tokens = new Map<string, Date>();

	constructor() {
		// Clear every 24h
		setInterval(
			() => {
				this.clearOutdatedTokens();
			},
			1000 * 60 * 60 * 24,
		);
	}

	generate() {
		const token = randomBytes(64).toString('base64url');
		const expiry = new Date();
		expiry.setMinutes(expiry.getMinutes() + EXPIRY_MINUTES);

		this.#tokens.set(token, expiry);

		return token;
	}

	validate(token: unknown) {
		if (typeof token !== 'string') {
			return false;
		}

		const expiry = this.#tokens.get(token);
		// use once only
		this.#tokens.delete(token);

		return !!expiry && expiry.getTime() > Date.now();
	}

	clearOutdatedTokens() {
		for (const [token, expiry] of this.#tokens) {
			if (expiry.getTime() <= Date.now()) {
				this.#tokens.delete(token);
			}
		}
	}
}

const csrf = new CSRF();

export default csrf;
