import {$} from '../$.js';

export function header(user: string | undefined) {
	return $`
<header>
	<a href="/">
		<h1>Home</h1>
	</a>
	<a href="/upload">
		<h1>Upload</h1>
	</a>

	<a class="login" href=${user ? '/logout' : '/login'}>
		${user ? 'Log out' : 'Log in'}
	</a>
</header>`;
}
