import {form} from '../components/form.js';
import type {Route} from '../route.js';

export type ParametersLogin = {
	readonly error: string | undefined;
};

export const RouteLogin = {
	title: 'Login',
	styles: ['login.css', 'form.css'],

	render({error}: ParametersLogin) {
		return form(
			'application/x-www-form-urlencoded',
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
			error,
		);
	},
} satisfies Route;
