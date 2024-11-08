import {readFile} from 'node:fs/promises';

import {$, type SafeString} from './$.js';
import {header} from './components/header.js';
import {type Parameters404, Route404} from './routes/404.js';
import {type ParametersIndex, RouteIndex} from './routes/index.js';
import {type ParametersLogin, RouteLogin} from './routes/login.js';
import {type ParametersUpload, RouteUpload} from './routes/upload.js';

type Arguments = {
	index: ParametersIndex;
	upload: ParametersUpload;
	login: ParametersLogin;
	'404': Parameters404;
};

export async function render<View extends keyof Arguments>(
	view: View,
	variables: Arguments[View] & {user: string | undefined},
) {
	let template = await readFile(
		new URL('../src/app.html', import.meta.url),
		'utf8',
	);

	let body: SafeString;
	let title: string | undefined;
	let styles: readonly string[];

	switch (view) {
		case 'index': {
			({title, styles} = RouteIndex);
			body = RouteIndex.render(variables as ParametersIndex);

			break;
		}
		case 'upload': {
			({title, styles} = RouteUpload);
			body = RouteUpload.render(variables as ParametersUpload);

			break;
		}
		case 'login': {
			({title, styles} = RouteLogin);
			body = RouteLogin.render(variables as ParametersLogin);

			break;
		}
		case '404': {
			({title, styles} = Route404);
			body = Route404.render();

			break;
		}
		default: {
			throw new Error(`Unknown view ${view}`);
		}
	}

	template = template
		.replace(
			'%head%',
			$`
				<title>${title && `${title} | `}Fileshare</title>
				${styles.map(href => $`<link rel="stylesheet" href="/static/${href}">`)}
			`.render(),
		)
		.replace(
			'%body%',
			$`
				${header(variables.user)}
				<main>
					${body}
				</main>
			`.render(),
		);

	return template;
}
