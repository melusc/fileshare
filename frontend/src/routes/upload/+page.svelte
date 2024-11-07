<script lang="ts">
	import Form from '../../components/form.svelte';
</script>

<Form
	enctype="multipart/form-data"
	inputs={[
		{
			name: 'file',
			label: 'File',
			type: 'file',
		},
		{
			name: 'longid',
			label: 'Use long id',
			type: 'checkbox',
		},
	]}
	submitLabel="Upload"
/>
