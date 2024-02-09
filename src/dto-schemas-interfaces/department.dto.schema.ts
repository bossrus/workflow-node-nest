import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
	IsBoolean,
	IsMongoId,
	IsNumber,
	IsOptional,
	IsString,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

@Schema()
export class IDepartment {
	@IsOptional()
	@IsMongoId()
	_id?: string;

	@Prop({ unique: true, required: true })
	@IsString()
	title: string;

	@Prop({ unique: true })
	@IsString()
	@IsOptional()
	titleSlug: string;

	@Prop({ required: true })
	@IsString()
	numberInWorkflow: string;

	@Prop({ required: true })
	@IsBoolean()
	isUsedInWorkflow: boolean;

	@Prop({ default: 0 })
	@IsNumber()
	@IsOptional()
	version?: number;

	@Prop({ default: undefined })
	@IsNumber()
	@IsOptional()
	isDeleted?: number;
}

export const DepartmentSchema = SchemaFactory.createForClass(IDepartment);

export class IDepartmentUpdate extends PartialType(IDepartment) {}
