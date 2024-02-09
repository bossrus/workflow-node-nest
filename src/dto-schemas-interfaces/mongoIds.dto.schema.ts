import { IsMongoId } from 'class-validator';

export class IMongoIdArray {
	@IsMongoId({ each: true })
	ids: string[];
}

export class IMongoId {
	@IsMongoId()
	ids: string;
}
