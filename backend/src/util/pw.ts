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
