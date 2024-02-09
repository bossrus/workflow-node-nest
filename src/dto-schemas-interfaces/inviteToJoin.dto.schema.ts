import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsMongoId, IsNumber, IsOptional } from 'class-validator';

@Schema()
export class IInviteToJoin {
	@IsOptional()
	@IsMongoId()
	_id?: string;

	@Prop()
	@IsMongoId()
	@IsOptional()
	from?: string;

	@Prop()
	@IsMongoId()
	to: string;

	@Prop()
	@IsMongoId()
	workflow: string;

	@Prop({ default: undefined })
	@IsNumber()
	@IsOptional()
	isDeleted?: number;
}

export const InviteToJoinSchema = SchemaFactory.createForClass(IInviteToJoin);
