import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsMongoId, IsNumber, IsOptional, IsString } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

@Schema()
export class IModification {
	@IsOptional()
	@IsMongoId()
	_id?: string;

	@Prop({ unique: true, required: true })
	@IsOptional()
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

export const ModificationSchema = SchemaFactory.createForClass(IModification);

export class IModificationUpdate extends PartialType(IModification) {}
