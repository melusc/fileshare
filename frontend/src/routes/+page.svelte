<script lang="ts">
	import {getUploads} from '../state.ts';

	let uploads = $state(getUploads());

	function clickDelete(id: string) {
		return async () => {
			try {
				const response = await fetch(`/api/file/${id}`, {
					method: 'delete',
				});
				const body = (await response.json()) as {success?: boolean};
				if (body.success) {
					const index = uploads!.findIndex(upload => upload.id === id);
					uploads!.splice(index, 1);
				}
			} catch {}
		};
	}
</script>

<svelte:head>
	<title>Fileshare</title>
</svelte:head>

{#if uploads && uploads.length > 0}
	<div class="uploads">
		<div class="title">
			<div>ID</div>
			<div>Author</div>
			<div>Date</div>
			<div>Delete Upload</div>
		</div>
		{#each uploads as { id, author, date } (id)}
			<div class="upload-entry">
				<a class="upload-link" href={`/${id}`}>{id}</a>
				<div class="upload-author">{author}</div>
				<div class="upload-date">{new Date(date).toLocaleString()}</div>
				<button class="upload-delete" onclick={clickDelete(id)}>Delete</button>
			</div>
		{/each}
	</div>
{:else if uploads}
	<div class="uploads">
		<a href="/upload">Upload your first file</a>
	</div>
{/if}

<style>
	.title {
		font-weight: 600;
	}

	.upload-entry,
	.title {
		display: grid;
		grid-template-columns: subgrid;
		grid-column: span 4;
	}

	.uploads {
		display: grid;
		flex-direction: column;
		grid-template-columns: repeat(4, 1fr);
		row-gap: 1em;
		width: 100%;
	}

	.upload-delete {
		outline: none;
		border: 2px solid var(--theme-primary);
		border-radius: 5px;
		background: none;
		padding: 5px 1em;
		cursor: pointer;
		width: max-content;
		transition: scale 50ms ease-in-out;
	}

	.upload-delete:focus {
		outline: 2px dashed #0d6efd;
	}

	.upload-delete:active {
		scale: 0.95;
	}
</style>
