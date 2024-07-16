import { Injectable } from '@nestjs/common';
import { ILog, ILogObject } from '@/dto-schemas-interfaces/log.dto.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { IMongoIdArray } from '@/dto-schemas-interfaces/mongoIds.dto.schema';

@Injectable()
export class LogService {
	constructor(@InjectModel(ILog.name) private logModel: Model<ILog>) {}

	/**
	 * Saves a log element to the log collection.
	 *
	 * @param {ILog} logElement - The log element to be saved.
	 * @returns {Promise<ILog>} - The saved log element.
	 */
	async saveToLog(logElement: ILog): Promise<ILog> {
		return this.logModel.create(logElement);
	}

	/**
	 * Retrieves logs by workflow IDs.
	 *
	 * @param {IMongoIdArray} workflowsIds - Array of workflow IDs.
	 * @returns {Promise<ILogObject>} - An object containing logs for each workflow ID.
	 */
	async getLogById(workflowsIds: IMongoIdArray): Promise<ILogObject> {
		const res: ILogObject = {};
		for (const id of workflowsIds.ids) {
			res[id] = await this.logModel.find({ idSubject: id }).exec();
		}
		return res;
	}
}
