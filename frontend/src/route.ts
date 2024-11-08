import type {SafeString} from './$.js';

export type Route = {
	readonly title: string | undefined;
	readonly styles: readonly string[];
	render(arguments_: unknown): SafeString;
};
