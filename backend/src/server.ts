import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import {fileTypeFromBuffer} from 'file-type';
import helmet from 'helmet';
import isPathInside from 'is-path-inside';
import morgan from 'morgan';
import {render} from 'frontend';
import type {Upload} from 'types';

import {staticRoot, uploadsDirectory} from './constants.ts';
import {database} from './database.ts';
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

app.use(jwt.setResponseLocals());

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
	express.static(staticRoot, {
		index: false,
		redirect: false,
	}),
);

app.use('/login', loginRouter);
app.use('/upload', uploadRouter);

app.use('/logout', (_request, response) => {
	response.clearCookie('session', {
		httpOnly: true,
		secure: true,
	});

	response.redirect('/login');
});

app.get('/robots.txt', (_request, response) => {
	response
		.status(200)
		.type('txt')
		.send(
			`User-agent: GPTBot
Disallow: /

User-agent: Google-Extended
Disallow: /`,
		);
});

app.get('/:id', async (request, response, next) => {
	const {id} = request.params;
	try {
		const filePath = path.join(fileURLToPath(uploadsDirectory), id);

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

app.get('/', jwt.guard(), async (_request, response) => {
	const list = database
		.prepare<
			[],
			Upload
		>('SELECT id, author, date FROM uploads ORDER BY date ASC;')
		.all();

	response.send(
		await render('index', {session: response.locals.session, uploads: list}),
	);
});

app.use(async (_request, response) => {
	response
		.status(404)
		.send(await render('404', {session: response.locals.session}));
});

app.listen(3178, () => {
	console.log('Listening on http://localhost:3178/');
});
