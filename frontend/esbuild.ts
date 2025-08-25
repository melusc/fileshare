/*!
	This program is free software: you can redistribute it
	and/or modify it under the terms of the GNU General Public
	License as published by the Free Software Foundation,
	either version 3 of the License, or (at your option)
	any later version.

	This program is distributed in the hope that it will be
	useful, but WITHOUT ANY WARRANTY; without even the implied
	warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR
	PURPOSE. See the GNU General Public License for more details.

	You should have received a copy of the GNU General Public
	License along with this program. If not, see <https://www.gnu.org/licenses/>.
*/

import {parseArgs} from 'node:util';

import esbuild from 'esbuild';

const {values: flags} = parseArgs({
	options: {
		watch: {
			short: 'w',
			type: 'boolean',
			default: false,
		},
	},
});

const esbuildOptions = {
	absWorkingDir: import.meta.dirname,
	outdir: 'dist/static',
	minify: true,
	platform: 'browser',
	entryPoints: ['src/static/*'],
} satisfies esbuild.BuildOptions;

if (flags.watch) {
	const context = await esbuild.context(esbuildOptions);
	await context.watch();
} else {
	await esbuild.build(esbuildOptions);
}
