import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
	ArrayNotEmpty,
	IsArray,
	IsBoolean,
	IsEmail,
	IsMongoId,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

@Schema()
export class IUser {
	@IsOptional()
	@IsMongoId()
	_id?: string;

	@Prop({ unique: true, required: true })
	@IsString()
	login: string;

	@Prop({ unique: true })
	@IsString()
	@IsOptional()
	loginSlug: string;

	@Prop({ default: null })
	@IsOptional()
	@IsString()
	loginToken?: string;

	@Prop({ required: true })
	@IsNotEmpty()
	name: string;

	@Prop()
	@IsString()
	@IsEmail()
	@IsOptional()
	email?: string;

	@Prop({ default: null })
	@IsOptional()
	@IsString()
	emailToken?: string;

	@Prop({ default: null })
	@IsOptional()
	@IsBoolean()
	emailConfirmed?: boolean;

	@Prop({ required: true })
	@IsString()
	password: string;

	@Prop({ required: true })
	@IsString()
	@IsMongoId()
	@IsOptional()
	currentDepartment?: string;

	@Prop({ default: null })
	@IsString()
	@IsMongoId()
	@IsOptional()
	currentWorkflowInWork?: string;

	@Prop({ required: true })
	@IsArray()
	@ArrayNotEmpty()
	@IsMongoId({ each: true })
	departments: string[];

	@Prop({ default: false })
	@IsOptional()
	@IsBoolean()
	isSendLetterAboutNewWorks: boolean;

	@Prop({ required: true })
	@IsBoolean()
	canStartStopWorks: boolean;

	@Prop({ required: true })
	@IsBoolean()
	canSeeStatistics: boolean;

	@Prop({ required: true })
	@IsBoolean()
	isAdmin: boolean;

	@Prop({ required: true })
	@IsBoolean()
	canMakeModification: boolean;

	@Prop({ default: undefined })
	@IsNumber()
	@IsOptional()
	isDeleted?: number;

	@Prop({ default: 0 })
	@IsNumber()
	@IsOptional()
	version?: number;

	@Prop({ default: undefined })
	@IsString()
	@IsOptional()
	authString?: string;

	@IsOptional()
	__v: string;
}

export const UserSchema = SchemaFactory.createForClass(IUser);

export class IUserUpdate extends PartialType(IUser) {}

export class IEmailRecipient {
	name: string;
	email: string;
}
