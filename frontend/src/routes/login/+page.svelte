<script>
	import Form from '../../components/form.svelte';
</script>

<svelte:head>
	<title>Login | Fileshare</title>
</svelte:head>

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
