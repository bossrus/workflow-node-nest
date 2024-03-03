import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsMongoId, IsNumber, IsOptional, IsString } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

@Schema()
export class ITypeOfWork {
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

	@Prop({ default: 0 })
	@IsNumber()
	@IsOptional()
	version?: number;

	@Prop({ default: undefined })
	@IsNumber()
	@IsOptional()
	isDeleted?: number;
}

export const TypeOfWorkSchema = SchemaFactory.createForClass(ITypeOfWork);

export class ITypeOfWorkUpdate extends PartialType(ITypeOfWork) {}
