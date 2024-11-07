import type {RequestHandler} from 'express';

export function setHeaders(headers: Record<string, string>): RequestHandler {
	return (_request, response, next) => {
		for (const [key, value] of Object.entries(headers)) {
			response.setHeader(key, value);
		}

		next();
	};
}
