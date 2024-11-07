<script lang="ts">
	import type {Snippet} from 'svelte';

	import Header from '../components/header.svelte';
	import '../common/sanitise.css';
	import '../common/theme.css';
	import '../common/font.css';

	const {children}: {children: Snippet} = $props();
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link
		rel="preconnect"
		href="https://fonts.gstatic.com"
		crossorigin="anonymous"
	/>
	<link
		href="https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300..800;1,300..800&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="App">
	<Header />

	<main>
		{@render children()}
	</main>
</div>

<style>
	.App {
		display: grid;
		min-height: 100vh;
		max-width: 100vw;
		grid-template-rows: max-content max-content 1fr;
	}

	.App > :global(*) {
		max-width: 100vw;
	}

	main {
		padding: 3em;
		width: 100%;
		display: flex;
		justify-content: center;
	}
</style>
