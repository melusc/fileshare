import rateLimit, {type RateLimitRequestHandler} from 'express-rate-limit';

// Separate rate limits per kind of request
// One for GET where there aren't any database reads
// One for GET where a database or file is read
// One for POST and family
// These use different stores for rate limits
// so visiting / doesn't affect the rate limit for accessing a file

let getStatic: RateLimitRequestHandler | undefined;
export function rateLimitGetStatic() {
	getStatic ??= rateLimit({
		windowMs: 5 * 60 * 1000, // 5 minutes
		limit: 100, // Limit each IP to 100 requests per window
		standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
		legacyHeaders: false, // Disable the `X-RateLimit-*` headers
	});
	return getStatic;
}

let getDatabase: RateLimitRequestHandler | undefined;
export function rateLimitGetDatabase() {
	getDatabase ??= rateLimit({
		windowMs: 5 * 60 * 1000,
		limit: 25,
		standardHeaders: true,
		legacyHeaders: false,
	});
	return getDatabase;
}

let post: RateLimitRequestHandler | undefined;
export function rateLimitPost() {
	post ??= rateLimit({
		windowMs: 15 * 60 * 1000,
		limit: 20,
		standardHeaders: true,
		legacyHeaders: false,
	});
	return post;
}
