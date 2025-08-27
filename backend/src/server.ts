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

import process from 'node:process';
import {fileURLToPath} from 'node:url';

import cookieParser from 'cookie-parser';
import express from 'express';
import {render} from 'frontend';
import helmet from 'helmet';
import morgan from 'morgan';

import {cleanupBeforeExit} from './cleanup.ts';
import {staticRoot, uploadsDirectory} from './constants.ts';
import {database, getUploads} from './database.ts';
import env from './env.ts';
import {
	rateLimitGetDatabase,
	rateLimitGetStatic,
} from './middleware/rate-limit.ts';
import {session, csrf} from './middleware/token.ts';
import {loginRouter} from './routes/login.ts';
import {uploadRouter} from './routes/upload.ts';

const app = express();
app.set('trust proxy', 'loopback');
app.set('x-powered-by', false);

app.use(cookieParser());
app.use(
	helmet({
		contentSecurityPolicy: {
			useDefaults: false,
			directives: {
				'default-src': ["'none'"],
				'script-src': ["'self'"],
				'style-src-elem': ["'self'", 'https://fonts.googleapis.com'],
				'font-src': ['https://fonts.gstatic.com'],
			},
		},
	}),
);
app.use(morgan('dev'));

app.use(session.middleware());

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

app.get('/:id', rateLimitGetDatabase(), (request, response, next) => {
	const id = request.params['id']!;
	try {
		const row = database
			.prepare('SELECT mime, filename FROM uploads WHERE id = :id')
			.get({
				id,
			}) as
			| {
					mime: string | null;
					filename: string | null;
			  }
			| undefined;

		if (row?.mime) {
			response.setHeader('Content-Type', row.mime);
		}
		if (row?.filename) {
			const encoded = encodeURIComponent(row.filename);
			response.setHeader(
				'Content-Disposition',
				`inline; filename*=UTF-8''${encoded}`,
			);
		} else {
			response.setHeader('Content-Disposition', 'inline');
		}

		response.sendFile(id, {
			root: fileURLToPath(uploadsDirectory),
			immutable: true,
		});
	} catch {
		next();
	}
});

app.get(
	'/',
	rateLimitGetDatabase(),
	session.guard(),
	async (_request, response) => {
		response.send(
			await render('index', {
				session: response.locals.session,
				uploads: getUploads(),
				csrfToken: csrf.generate(response),
			}),
		);
	},
);

app.use(async (_request, response) => {
	response
		.status(404)
		.send(await render('404', {session: response.locals.session}));
});

function onServerListening(error: unknown) {
	if (error) {
		console.error('Error creating server', error);
		return;
	}

	const listening = env.socketPath ?? `http://${env.host}:${env.port}`;
	console.log('Listening on %s', listening);
	process.send?.('ready');
}

const server = env.socketPath
	? app.listen(env.socketPath, onServerListening)
	: app.listen(env.port, env.host, onServerListening);

cleanupBeforeExit(() => {
	server.close();
});
