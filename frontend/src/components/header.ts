import type {Session} from 'types';

import {$} from '../$.js';

export function header(session: Session | undefined) {
	return $`
<header>
	<a href="/">
		<h1>Home</h1>
	</a>
	<a href="/upload">
		<h1>Upload</h1>
	</a>

	<a class="login" href=${session ? '/logout' : '/login'}>
		${session ? 'Log out' : 'Log in'}
	</a>
</header>`;
}
