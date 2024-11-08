import {browser} from '$app/environment';

type FormState = {
	error: string | null;
};
declare const formState: FormState;

export function getFormState(): FormState {
	if (!browser) {
		return {
			error: null,
		};
	}

	if (typeof formState !== 'object') {
		throw new TypeError('formState was not defined');
	}

	return formState;
}

declare const loggedInUser: string | false;

export function getUser(): string | false {
	if (!browser) {
		return false;
	}

	if (typeof loggedInUser !== 'string' && typeof loggedInUser !== 'boolean') {
		throw new TypeError('loggedInUser was not set');
	}

	return loggedInUser;
}

declare const files: readonly string[];
const isReadonlyArray = Array.isArray as (
	argument0: unknown,
) => argument0 is readonly unknown[];

export function getFiles(): string[] {
	if (!browser) {
		return [];
	}

	if (typeof files !== 'object' || !isReadonlyArray(files)) {
		throw new TypeError('files was not set');
	}

	return [...files];
}
