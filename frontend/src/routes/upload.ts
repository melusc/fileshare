import {form} from '../components/form.js';
import type {Route} from '../route.js';

export type ParametersUpload = {
	readonly error: string | undefined;
};

export const RouteUpload = {
	title: 'Upload',
	styles: ['form.css'],

	render({error}: ParametersUpload) {
		return form(
			'multipart/form-data',
			[
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
			],
			'Upload',
			error,
		);
	},
} satisfies Route;
