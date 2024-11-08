<script lang="ts">
	import {getUser} from '../state.ts';

	const user = getUser();
</script>

<header>
	<a href="/">
		<h1>Home</h1>
	</a>
	<a href="/upload">
		<h1>Upload</h1>
	</a>

	<a class="login" href={user ? '/logout' : '/login'}>
		{user ? 'Log out' : 'Log in'}
	</a>
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
