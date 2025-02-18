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

import {readFile} from 'node:fs/promises';

import type {Session} from 'types';

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
	variables: Arguments[View] & {session: Session | undefined},
) {
	// eslint-disable-next-line security/detect-non-literal-fs-filename
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
				${header(variables.session)}
				<main>
					${body}
				</main>
			`.render(),
		);

	return template;
}
