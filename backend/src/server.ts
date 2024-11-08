import {readdir, readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import {fileTypeFromBuffer} from 'file-type';
import helmet from 'helmet';
import isPathInside from 'is-path-inside';
import morgan from 'morgan';

import {staticRoot, uploadsDirectory} from './constants.ts';
import {setHeaders} from './middleware/set-headers.ts';
import {apiRouter} from './routes/api.ts';
import {loginRouter} from './routes/login.ts';
import {uploadRouter} from './routes/upload.ts';
import {jwt} from './session-token.ts';
import {svelteKitEngine} from './svelte-kit-engine.ts';

const app = express();

app.engine('html', svelteKitEngine(['formState', 'loggedInUser', 'files']));
app.set('view engine', 'html');
app.set('views', staticRoot);

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
		response.status(404).render('404', {
			loggedInUser: jwt.getUser(request),
		});
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

app.get('/', jwt.guard(), async (request, response) => {
	const list = await readdir(uploadsDirectory);

	response.render('index', {
		loggedInUser: jwt.getUser(request),
		files: list,
	});
});

app.use((request, response) => {
	response.status(404).render('404', {
		loggedInUser: jwt.getUser(request),
	});
});

app.listen(3178, () => {
	console.log('Listening on http://localhost:3178/');
});
