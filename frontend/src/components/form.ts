import {$} from '../$.js';

export function form(
	enctype: 'multipart/form-data' | 'application/x-www-form-urlencoded',
	inputs: ReadonlyArray<{
		label: string;
		name: string;
		type: 'checkbox' | 'text' | 'file' | 'password';
	}>,
	submitLabel: string,
	csrfToken: string,
	uploadError: string | undefined,
) {
	return $`
${uploadError && $`<div class="error">${uploadError}</div>`}

<form method="POST" enctype="${enctype}">
	${inputs.map(
		({label, type, name}) => $`
		<label for="${name}">${label}</label>
		<input type="${type}" name="${name}" id="${name}" ${type !== 'checkbox' && $`required`} />
	`,
	)}

	<input type="hidden" name="csrfToken" value="${csrfToken}" />
	<input type="submit" name="submit" class="submit" value="${submitLabel}" />
</form>`;
}
