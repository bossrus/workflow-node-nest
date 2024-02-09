import { Injectable } from '@nestjs/common';
import { ILog } from '@/dto-schemas-interfaces/log.dto.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class LogService {
	constructor(@InjectModel(ILog.name) private logModel: Model<ILog>) {}

	async saveToLog(logElement: ILog): Promise<ILog> {
		return this.logModel.create(logElement);
	}

	async getLogById(id: string): Promise<ILog[]> {
		return this.logModel.find({ idMainWorkflow: id });
	}
}
