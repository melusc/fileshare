<script lang="ts">
	import {browser} from '$app/environment';

	let loggedIn = $state(false);

	async function getLoggedIn() {
		const response = await fetch('/api/whoami', {
			cache: 'no-cache',
		});
		const body = (await response.json()) as {
			loggedIn: boolean;
		};

		loggedIn = body.loggedIn;
	}

	if (browser) {
		void getLoggedIn();
	}
</script>

<header>
	<a href="/">
		<h1>Home</h1>
	</a>
	<a href="/upload">
		<h1>Upload</h1>
	</a>

	<a class="login" href={loggedIn ? '/logout' : '/login'}
		>{loggedIn ? 'Log out' : 'Log in'}</a
	>
</header>

<style>
	header {
		width: 100%;
		padding: 1em;

		position: sticky;
		top: 0;

		display: flex;
		flex-direction: row;
		align-items: center;

		gap: 2em;

		background-color: var(--theme-primary);

		user-select: none;
		box-shadow: var(--box-shadow);

		color: var(--text-light);
	}

	h1 {
		margin: 0;
	}

	a {
		font-weight: 600;
	}

	.login {
		margin-left: auto;
	}
</style>
