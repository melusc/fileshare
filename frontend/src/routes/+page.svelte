<script lang="ts">
	import {getFiles} from '../state.ts';

	const files = getFiles();

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
	<title>Fileshare</title>
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
