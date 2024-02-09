import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
	IsArray,
	IsBoolean,
	IsMongoId,
	IsNumber,
	IsOptional,
	IsString,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

@Schema()
export class IWorkflow {
	@IsOptional()
	@IsMongoId()
	_id?: string;

	@Prop()
	@IsMongoId()
	@IsOptional()
	mainId?: string;

	@Prop({ unique: true, required: true })
	@IsString()
	title: string;

	@Prop({ unique: true })
	@IsString()
	@IsOptional()
	titleSlug: string;

	@Prop({ required: true })
	@IsNumber()
	countPages: number;

	@Prop({ required: true })
	@IsNumber()
	countPictures: number;

	@Prop({ required: true })
	@IsMongoId()
	type: string;

	@Prop({ required: true })
	@IsMongoId()
	firm: string;

	@Prop({ required: true })
	@IsMongoId()
	modification: string;

	@Prop({ required: true })
	@IsMongoId()
	currentDepartment: string;

	@Prop({ required: true })
	@IsMongoId()
	whoAddThisWorkflow: string;

	@Prop({ default: undefined })
	@IsNumber()
	@IsOptional()
	isPublished?: number;

	@Prop({ default: [] })
	@IsArray()
	@IsOptional()
	@IsMongoId({ each: true })
	executors?: string[];

	@Prop({ required: true })
	@IsBoolean()
	setToStat: boolean;

	@Prop({ required: true })
	@IsString()
	description: string;

	@Prop({ required: true })
	@IsNumber()
	urgency: number;

	@Prop({ default: undefined })
	@IsNumber()
	@IsOptional()
	isCheckedOnStat?: number;

	@Prop({ default: undefined })
	@IsNumber()
	@IsOptional()
	isDone?: number;

	@Prop({ default: 0 })
	@IsNumber()
	@IsOptional()
	version?: number;

	@Prop({ default: undefined })
	@IsNumber()
	@IsOptional()
	isDeleted?: number;
}

export interface IWorkflowsObject {
	[indexedDB: string]: IWorkflow;
}

export const WorkflowSchema = SchemaFactory.createForClass(IWorkflow);

export class IWorkflowUpdate extends PartialType(IWorkflow) {}

WorkflowSchema.pre('save', function (next) {
	if (!this.mainId) {
		this.mainId = this._id;
	}
	next();
});
