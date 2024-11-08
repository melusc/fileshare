import {randomBytes} from 'node:crypto';
import {stdin, stdout} from 'node:process';
// eslint-disable-next-line n/no-unsupported-features/node-builtins
import {createInterface} from 'node:readline/promises';
import {fileURLToPath} from 'node:url';
import {parseArgs} from 'node:util';

import Database, {type Database as TDatabase} from 'better-sqlite3';

import {databasePath} from './constants.ts';
import {scrypt} from './util/promisified.ts';
import {generatePassword} from './util/pw.js';

export const database: TDatabase = new Database(fileURLToPath(databasePath));

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

database.pragma('journal_mode = WAL');

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
				author TEXT NOT NULL
		);
	`,
);

if (shouldCreateLogin) {
	const rl = createInterface({
		input: stdin,
		output: stdout,
	});

	const username = await rl.question('Username: ');
	const password = generatePassword(16);

	rl.close();

	const salt = randomBytes(64);
	const passwordHash = await scrypt(password, salt, 64);

	database
		.prepare<{
			username: string;
			passwordHash: Buffer;
			salt: Buffer;
		}>(
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
