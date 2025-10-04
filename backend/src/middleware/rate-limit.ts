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

import rateLimit, {
	type Options as RateLimitOptions,
	type RateLimitRequestHandler,
} from 'express-rate-limit';

// Separate rate limits per kind of request
// One for GET where there aren't any database reads
// One for GET where a database or file is read
// One for POST and family
// These use different stores for rate limits
// so visiting / doesn't affect the rate limit for accessing a file

const baseOptions = {
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
	validate: {
		// trust proxy is set from env variable
		// user knows risks
		trustProxy: false,
	},
} satisfies Partial<RateLimitOptions>;

let getStatic: RateLimitRequestHandler | undefined;
export function rateLimitGetStatic() {
	getStatic ??= rateLimit({
		windowMs: 5 * 60 * 1000, // 5 minutes
		limit: 100, // Limit each IP to 100 requests per window
		...baseOptions,
	});
	return getStatic;
}

let getDatabase: RateLimitRequestHandler | undefined;
export function rateLimitGetDatabase() {
	getDatabase ??= rateLimit({
		windowMs: 5 * 60 * 1000,
		limit: 25,
		...baseOptions,
	});
	return getDatabase;
}

let post: RateLimitRequestHandler | undefined;
export function rateLimitPost() {
	post ??= rateLimit({
		windowMs: 15 * 60 * 1000,
		limit: 20,
		...baseOptions,
	});
	return post;
}

let api: RateLimitRequestHandler | undefined;
export function rateLimitApi() {
	api ??= rateLimit({
		windowMs: 5 * 60 * 1000,
		limit: 50,
		...baseOptions,
	});
	return api;
}
