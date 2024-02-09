import { Types } from 'mongoose';
import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class isValidIdPipe implements PipeTransform<string> {
	transform(value: string): string {
		const validObjectId: boolean = Types.ObjectId.isValid(value);

		if (!validObjectId) {
			throw new BadRequestException('Invalid ObjectId');
		}

		return value;
	}
}

export function isValidMongodbId(id: string) {
	return Types.ObjectId.isValid(id);
}
