import {mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

const dataDirectory = new URL('../data/', import.meta.url);
export const uploadsDirectory = new URL('uploads/', dataDirectory);

await mkdir(uploadsDirectory, {recursive: true});
export const databasePath = new URL('database.db', dataDirectory);

export const staticRoot = fileURLToPath(import.meta.resolve('frontend/static'));
