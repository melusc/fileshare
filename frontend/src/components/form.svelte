<script lang="ts">
	import type {HTMLInputTypeAttribute} from 'svelte/elements';

	const {
		enctype,
		inputs,
		submitLabel,
	}: {
		enctype: 'multipart/form-data' | 'application/x-www-form-urlencoded';
		inputs: ReadonlyArray<{
			label: string;
			name: string;
			type: HTMLInputTypeAttribute;
		}>;
		submitLabel: string;
	} = $props();
</script>

<form method="POST" {enctype}>
	{#each inputs as { label, name, type } (name)}
		<label for={name}>{label}</label>
		<input {type} {name} id={name} />
	{/each}

	<input type="submit" name="submit" class="submit" value={submitLabel} />
</form>

<style>
	form {
		display: grid;
		width: max-content;
		align-items: center;
		row-gap: 5px;

		grid-template-rows: 1fr 1fr 1fr;
		grid-template-columns: 1fr 1fr;
	}

	input {
		justify-self: flex-start;
	}

	.submit {
		grid-column: 1 / 3;
		width: 100%;
		font: inherit;

		outline: none;
		border: 2px solid var(--theme-primary);
		border-radius: 5px;
		background: none;
		padding: 5px 1em;
		cursor: pointer;

		transition: scale 50ms ease-in-out;
	}

	input:focus {
		outline: 2px solid #0d6efd;
	}

	.submit:active {
		scale: 0.95;
	}
</style>
