<script lang="ts">
	import {browser} from '$app/environment';

	import Loading from '../components/loading.svelte';

	let files = $state<string[]>();

	async function loadFiles() {
		const response = await fetch('/api/files', {
			cache: 'no-cache',
		});
		const body = await response.json();
		if (Array.isArray(body)) {
			files = body as string[];
		}
	}

	if (browser) {
		void loadFiles();
	}

	function clickDelete(id: string) {
		return async () => {
			try {
				await fetch(`/api/file/${id}`, {
					method: 'delete',
				});
				const index = files!.indexOf(id);
				files!.splice(index, 1);
			} catch {}
		};
	}
</script>

<svelte:head>
	<title></title>
</svelte:head>

{#if files && files.length > 0}
	<div class="files">
		{#each files as file (file)}
			<div class="file-entry">
				<a class="file-link" href={`/${file}`}>{file}</a>
				<button class="file-delete" onclick={clickDelete(file)}>Delete</button>
			</div>
		{/each}
	</div>
{:else if files}
	<div class="files">
		<a href="/upload">Upload your first file</a>
	</div>
{:else}
	<Loading />
{/if}

<style>
	.files {
		display: flex;
		flex-direction: column;
		row-gap: 1em;
		width: 100%;
	}

	.file-entry {
		display: flex;
		flex-direction: row;
	}

	.file-delete {
		margin-left: auto;

		outline: none;
		border: 2px solid var(--theme-primary);
		border-radius: 5px;
		background: none;
		padding: 5px 1em;
		cursor: pointer;

		transition: scale 50ms ease-in-out;
	}

	.file-delete:focus {
		outline: 2px dashed #0d6efd;
	}

	.file-delete:active {
		scale: 0.95;
	}
</style>
