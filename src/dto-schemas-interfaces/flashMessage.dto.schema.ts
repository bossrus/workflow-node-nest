import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
	IsIn,
	IsMongoId,
	IsNumber,
	IsOptional,
	IsString,
} from 'class-validator';

const TypesFlashMessages = ['success', 'error', 'info'] as const;

export type ITypesFlashMessages = (typeof TypesFlashMessages)[number];

@Schema()
export class IFlashMessages {
	@IsOptional()
	@IsMongoId()
	_id?: string;

	@Prop({ required: true })
	@IsIn(TypesFlashMessages)
	type: ITypesFlashMessages;

	@Prop()
	@IsMongoId()
	to: string;

	@Prop({ required: true })
	@IsString()
	message: string;

	@Prop({ default: undefined })
	@IsNumber()
	@IsOptional()
	isDeleted?: number;
}

export const FlashMessagesSchema = SchemaFactory.createForClass(IFlashMessages);
