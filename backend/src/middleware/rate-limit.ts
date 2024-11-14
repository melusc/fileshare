import rateLimit from 'express-rate-limit';

// Separate rate limits per kind of request
// One for GET where there aren't any database reads
// One for GET where a database or file is read
// One for POST and family
// These use different stores for rate limits
// so visiting / doesn't affect the rate limit for accessing a file

export function rateLimitGetStatic() {
	return rateLimit({
		windowMs: 5 * 60 * 1000, // 5 minutes
		limit: 200, // Limit each IP to 100 requests per window
		standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
		legacyHeaders: false, // Disable the `X-RateLimit-*` headers
	});
}

export function rateLimitGetDatabase() {
	return rateLimit({
		windowMs: 15 * 60 * 1000,
		limit: 50,
		standardHeaders: true,
		legacyHeaders: false,
	});
}

export function rateLimitPost() {
	return rateLimit({
		windowMs: 15 * 60 * 1000,
		limit: 20,
		standardHeaders: true,
		legacyHeaders: false,
	});
}
