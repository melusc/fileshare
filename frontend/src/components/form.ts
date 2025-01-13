import {$} from '../$.js';

export function form(
	inputs: ReadonlyArray<{
		label: string;
		name: string;
		type: 'checkbox' | 'text' | 'file' | 'password' | 'hidden';
		value?: string;
	}>,
	submitLabel: string,
	csrfToken: string,
	uploadError: string | undefined,
) {
	return $`
${uploadError && $`<div class="error">${uploadError}</div>`}

<form method="POST" enctype="multipart/form-data">
	${inputs.map(
		({label, type, name, value}) => $`
		${type !== 'hidden' && $`<label for="${name}">${label}</label>`}
		<input
			type="${type}"
			name="${name}"
			id="${name}"
			${typeof value === 'string' && $`value="${value}"`}
			${type !== 'checkbox' && 'required'}
		/>
	`,
	)}

	<input type="hidden" name="csrf-token" value="${csrfToken}" />
	<input type="submit" name="submit" class="submit" value="${submitLabel}" />
</form>`;
}
