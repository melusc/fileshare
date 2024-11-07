import {readFile} from 'node:fs/promises';
import path from 'node:path';

import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import {fileTypeFromBuffer} from 'file-type';
import helmet from 'helmet';
import morgan from 'morgan';

import {staticRoot, uploadsDirectory} from './constants.ts';
import {setHeaders} from './middleware/set-headers.ts';
import {apiRouter} from './routes/api.ts';
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

app.use((request, response, next) => {
	const segments = request.path.split('/');
	if (segments.includes('..')) {
		response.status(418).type('txt').send('..');
		return;
	}

	next();
});

app.use((request, response, next) => {
	if (request.path.includes('\\')) {
		response.status(404).sendFile(path.join(staticRoot, '404.html'));
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
app.use('/api', apiRouter);

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
		const file = await readFile(new URL(id, uploadsDirectory));
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

app.get('/', jwt.guard(), (_request, response) => {
	response.sendFile(path.join(staticRoot, 'index.html'));
});

app.use((_request, response) => {
	console.log(path.join(staticRoot, '404.html'));
	response.status(404).sendFile(path.join(staticRoot, '404.html'));
});

app.listen(3178, () => {
	console.log('Listening on http://localhost:3178/');
});