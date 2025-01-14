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

import {randomInt} from 'node:crypto';

const lowercaseCharSet = 'abcdefghijklmnopqrstuvwxyz';
const uppercaseCharSet = lowercaseCharSet.toUpperCase();
const numberCharSet = '0123456789';
const specialCharSet = '!@#$%*';
const allCharactersSet =
	lowercaseCharSet + uppercaseCharSet + numberCharSet + specialCharSet;

function getRandom(charset: string) {
	return charset[randomInt(charset.length)]!;
}

function shuffleArray<T>(array: T[]): T[] {
	for (let index1 = array.length - 1; index1 > 0; index1--) {
		const index2 = randomInt(index1);
		[array[index1], array[index2]] = [array[index2]!, array[index1]!];
	}

	return array;
}

export function generatePassword(length: number): string {
	let password =
		getRandom(lowercaseCharSet) +
		getRandom(uppercaseCharSet) +
		getRandom(numberCharSet) +
		getRandom(specialCharSet);

	while (password.length < length) {
		password += getRandom(allCharactersSet);
	}

	return shuffleArray([...password]).join('');
}
