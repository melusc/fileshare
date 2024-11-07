<script>
	import Form from '../../components/form.svelte';
</script>

<Form
	enctype="application/x-www-form-urlencoded"
	inputs={[
		{
			label: 'Username',
			type: 'text',
			name: 'username',
		},
		{
			label: 'Password',
			type: 'password',
			name: 'password',
		},
	]}
	submitLabel="Login"
/>
