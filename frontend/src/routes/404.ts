import {$} from '../$.js';
import type {Route} from '../route.js';

// None
export type Parameters404 = {
	''?: undefined;
};

export const Route404 = {
	title: '404 — Page not found',
	styles: ['404.css'],

	render() {
		return $`<h1 class="info-not-found">404 — Page not found</h1>`;
	},
} satisfies Route;
