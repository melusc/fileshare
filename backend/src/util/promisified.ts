import type {Buffer} from 'node:buffer';
import {scrypt as scryptCallback} from 'node:crypto';

export async function scrypt(
	password: string | Buffer,
	salt: string | Buffer,
	keylen: number,
	options?: {
		cost?: number;
		blockSize?: number;
		parallelization?: number;
		maxmem?: number;
	},
): Promise<Buffer> {
	return new Promise<Buffer>((resolve, reject) => {
		scryptCallback(password, salt, keylen, options ?? {}, (error, value) => {
			if (error) {
				reject(error);
			} else {
				resolve(value);
			}
		});
	});
}
