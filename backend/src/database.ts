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

import {randomBytes} from 'node:crypto';
import {stdin, stdout} from 'node:process';
// eslint-disable-next-line n/no-unsupported-features/node-builtins
import {createInterface} from 'node:readline/promises';
// eslint-disable-next-line n/no-unsupported-features/node-builtins
import {DatabaseSync} from 'node:sqlite';
import {fileURLToPath} from 'node:url';
import {parseArgs} from 'node:util';

import {generatePassword} from '@lusc/util/generate-password';
import type {Upload} from 'types';

import {cleanupBeforeExit} from './cleanup.ts';
import {databasePath} from './constants.ts';
import {scrypt} from './util/promisified.ts';

export const database = new DatabaseSync(fileURLToPath(databasePath));

const {
	values: {'create-login': shouldCreateLogin},
} = parseArgs({
	options: {
		'create-login': {
			type: 'boolean',
			short: 'c',
			default: false,
		},
	},
});

database.exec('PRAGMA journal_mode=WAL');
database.exec('PRAGMA foreign_keys=ON');

database.exec(
	`
		CREATE TABLE IF NOT EXISTS logins (
			username TEXT PRIMARY KEY,
			passwordHash BLOB NOT NULL,
			passwordSalt BLOB NOT NULL
		);

		CREATE TABLE IF NOT EXISTS uploads (
			id TEXT PRIMARY KEY,
			date TEXT NOT NULL,
			author TEXT NOT NULL,
			mime TEXT,
			filename TEXT,
			FOREIGN KEY(author) REFERENCES logins(username)
		);

		CREATE TABLE IF NOT EXISTS apiTokens (
			id TEXT PRIMARY KEY,
			date TEXT NOT NULL,
			owner TEXT NOT NULL,
			token TEXT NOT NULL,
			name TEXT NOT NULL,
			FOREIGN KEY(owner) REFERENCES logins(username)
		);
	`,
);

if (shouldCreateLogin) {
	const rl = createInterface({
		input: stdin,
		output: stdout,
	});

	const username = await rl.question('Username: ');
	const password = generatePassword({length: 16});

	rl.close();

	const salt = randomBytes(64);
	const passwordHash = await scrypt(password, salt, 64);

	database
		.prepare(
			`
			INSERT INTO logins
				(username, passwordHash, passwordSalt)
				values
				(:username, :passwordHash, :salt);
		`,
		)
		.run({
			username,
			passwordHash,
			salt,
		});

	console.log('Created user "%s" with password %s', username, password);
}

export function getUploads() {
	return database
		.prepare(
			'SELECT id, author, date, mime, filename FROM uploads ORDER BY date ASC;',
		)
		.all() as Upload[];
}

cleanupBeforeExit(() => {
	database.close();
});
