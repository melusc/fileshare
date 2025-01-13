import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import {fileTypeFromBuffer} from 'file-type';
import {render} from 'frontend';
import helmet from 'helmet';
import isPathInside from 'is-path-inside';
import morgan from 'morgan';

import {staticRoot, uploadsDirectory} from './constants.ts';
import csrf from './csrf.ts';
import {getUploads} from './database.ts';
import {
	rateLimitGetDatabase,
	rateLimitGetStatic,
} from './middleware/rate-limit.ts';
import {setHeaders} from './middleware/set-headers.ts';
import {loginRouter} from './routes/login.ts';
import {uploadRouter} from './routes/upload.ts';
import {jwt} from './session-token.ts';

const app = express();

app.use(cookieParser());
app.use(
	helmet({
		contentSecurityPolicy: {
			directives: {
				'script-src': ["'self'", "'unsafe-inline'"],
			},
		},

		// Nginx already sets the following
		xContentTypeOptions: false,
		strictTransportSecurity: false,
		xFrameOptions: false,
		xXssProtection: false,
	}),
);
app.use(cors());
app.use(morgan('dev'));

app.use(
	setHeaders({
		'permissions-policy': 'interest-cohort=()',
	}),
);

app.use(jwt.responseLocalsMiddleware());
app.use(jwt.cookieRenewalMiddleware());

app.use((request, response, next) => {
	const segments = request.path.split('/');
	if (segments.includes('..')) {
		response.status(418).type('txt').send('..');
		return;
	}

	next();
});

app.use(async (request, response, next) => {
	if (request.path.includes('\\')) {
		response
			.status(404)
			.send(await render('404', {session: response.locals.session}));
		return;
	}

	next();
});

app.use(
	'/static',
	rateLimitGetStatic(),
	express.static(staticRoot, {
		index: false,
		redirect: false,
	}),
);

app.use('/login', loginRouter);
app.use('/upload', uploadRouter);

app.use('/logout', rateLimitGetDatabase(), (_request, response) => {
	response.clearCookie('session', {
		httpOnly: true,
		secure: true,
	});

	response.redirect('/login');
});

app.get('/:id', rateLimitGetDatabase(), async (request, response, next) => {
	const {id} = request.params;
	try {
		const filePath = path.join(fileURLToPath(uploadsDirectory), id!);

		if (!isPathInside(filePath, fileURLToPath(uploadsDirectory))) {
			next();
			return;
		}

		const file = await readFile(filePath);
		const fileType = await fileTypeFromBuffer(file);
		response.setHeader('Content-Disposition', 'inline');
		if (fileType) {
			response.setHeader('Content-Type', fileType.mime);
		}
		response.send(file);
	} catch {
		next();
	}
});

app.get(
	'/',
	rateLimitGetDatabase(),
	jwt.guard(),
	async (_request, response) => {
		response.send(
			await render('index', {
				session: response.locals.session,
				uploads: getUploads(),
				csrfToken: csrf.generate(response.locals.session!.user),
			}),
		);
	},
);

app.use(async (_request, response) => {
	response
		.status(404)
		.send(await render('404', {session: response.locals.session}));
});

app.listen(3178, () => {
	console.log('Listening on http://localhost:3178/');
});
