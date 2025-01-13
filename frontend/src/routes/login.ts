import {form} from '../components/form.js';
import type {Route} from '../route.js';

export type ParametersLogin = {
	readonly error: string | undefined;
	readonly csrfToken: string;
};

export const RouteLogin = {
	title: 'Login',
	styles: ['form.css'],

	render({error, csrfToken}: ParametersLogin) {
		return form(
			[
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
			],
			'Login',
			csrfToken,
			error,
		);
	},
} satisfies Route;
