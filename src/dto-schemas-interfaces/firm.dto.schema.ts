import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsMongoId, IsNumber, IsOptional, IsString } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

@Schema()
export class IFirm {
	@IsOptional()
	@IsMongoId()
	_id?: string;

	@Prop({ unique: true, required: true })
	@IsString()
	title: string;

	@Prop({ unique: true, required: true })
	@IsString()
	@IsOptional()
	titleSlug?: string;

	@Prop({ default: 50000 })
	@IsNumber()
	@IsOptional()
	basicPriority?: number;

	@Prop({ default: 0 })
	@IsNumber()
	@IsOptional()
	version?: number;

	@Prop({ default: undefined })
	@IsNumber()
	@IsOptional()
	isDeleted?: number;
}

export const FirmSchema = SchemaFactory.createForClass(IFirm);

export class IFirmUpdate extends PartialType(IFirm) {}
