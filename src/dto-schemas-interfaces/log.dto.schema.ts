import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
	IsIn,
	IsMongoId,
	IsNumber,
	IsOptional,
	IsString,
} from 'class-validator';

const logOperations = [
	'create',
	'publish',
	'transfer',
	'add_to_description',
	'edit',
	'delete',
	'take',
	'close',
	'check',
] as const;

type ILogOperation = (typeof logOperations)[number];

const logBD = [
	'workflow',
	'user',
	'department',
	'firm',
	'modification',
	'type',
	'invite',
	'flash',
] as const;
type ILogBD = (typeof logBD)[number];

@Schema()
export class ILog {
	@Prop()
	@IsIn(logBD)
	bd: ILogBD;

	@Prop()
	@IsMongoId()
	idSubject: string;

	@Prop()
	@IsMongoId()
	@IsOptional()
	idMainWorkflow?: string;

	@Prop()
	@IsMongoId()
	idWorker: string;

	@Prop()
	@IsMongoId()
	@IsOptional()
	fromDepartment?: string;

	@Prop()
	@IsMongoId()
	@IsOptional()
	toDepartment?: string;

	@Prop()
	@IsNumber()
	date: number;

	@Prop()
	@IsIn(logOperations)
	operation: ILogOperation;

	@Prop()
	@IsString()
	@IsOptional()
	description?: string;
}

export const LogSchema = SchemaFactory.createForClass(ILog);

export interface ILogObject {
	[key: string]: ILog[];
}
