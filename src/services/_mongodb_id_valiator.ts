import { Types } from 'mongoose';
import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

/**
 * This class is a custom pipe that validates if a given string is a valid MongoDB ObjectId.
 * If the string is not a valid ObjectId, it throws a BadRequestException.
 */
@Injectable()
export class isValidIdPipe implements PipeTransform<string> {
	/**
	 * Transforms the input value by validating if it is a valid MongoDB ObjectId.
	 * @param value - The input string to be validated.
	 * @returns The input value if it is valid.
	 * @throws BadRequestException if the input value is not a valid ObjectId.
	 */
	transform(value?: string): string {
		const validObjectId: boolean = value
			? Types.ObjectId.isValid(value)
			: true;

		if (!validObjectId) {
			throw new BadRequestException('Invalid ObjectId');
		}

		return value;
	}
}

/**
 * This function checks if a given string is a valid MongoDB ObjectId.
 * @param id - The string to be validated.
 * @returns A boolean indicating whether the string is a valid ObjectId.
 */
export function isValidMongodbId(id: string) {
	return Types.ObjectId.isValid(id);
}
