import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import {
	IModification,
	IModificationUpdate,
} from '@/dto-schemas-interfaces/modification.dto.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WebsocketService } from '@/websockets/websocket.service';
import makeSlug from '@/services/makeSlug';
import { DB_IGNORE_FIELDS } from '@/consts/db';
import { ModificationsDBService } from '@/BD/modificationsDB.service';
import { LogService } from '@/log/log.service';

@Injectable()
export class ModificationsService {
	constructor(
		@InjectModel(IModification.name)
		private modificationModel: Model<IModification>,
		private websocket: WebsocketService,
		private modificationsDBService: ModificationsDBService,
		private logService: LogService,
	) {}

	async onModuleInit() {
		console.log('\tзагружаю modificationsDB');
		this.modificationsDBService.modifications =
			await this.loadModificationsFromBase();
	}

	async createModification(
		createModificationDto: IModification,
		login: string,
	): Promise<IModification> {
		await this.checkExist(createModificationDto.title);
		createModificationDto.titleSlug = makeSlug(createModificationDto.title);
		const newModification = await this.modificationModel.create(
			createModificationDto,
		);
		await this.websocket.sendMessage({
			bd: 'modification',
			operation: 'update',
			id: newModification._id.toString(),
			version: newModification.version,
		});
		await this.logService.saveToLog({
			bd: 'modification',
			date: Date.now(),
			description: 'modification',
			operation: 'create',
			idWorker: login,
			idSubject: newModification._id.toString(),
		});
		this.modificationsDBService.setModification(newModification.toObject());
		return newModification;
	}

	async loadModificationsFromBase() {
		return this.modificationModel
			.find({ isDeleted: null }, DB_IGNORE_FIELDS)
			.lean();
	}

	async findAllModifications(): Promise<IModification[]> {
		return this.modificationsDBService.modifications;
	}

	findModificationById(id: string): IModification {
		return this.modificationsDBService.getById(id);
	}

	async updateModification(
		{ _id, ...updateModification }: IModificationUpdate,
		login: string,
	): Promise<IModification> {
		if (!_id) {
			throw new BadRequestException('Modification _id is required');
		}
		const modification = await this.modificationModel.findOne(
			{
				_id,
				isDeleted: null,
			},
			DB_IGNORE_FIELDS,
		);
		if (!modification) {
			throw new NotFoundException('Modification not found');
		}
		const newModification = {
			...modification.toObject(),
			...updateModification,
			version: modification.version + 1,
		};
		if (updateModification.title) {
			await this.checkExist(updateModification.title);
			newModification.titleSlug = makeSlug(updateModification.title);
		}
		const savedModification = await this.modificationModel
			.findOneAndUpdate(
				{
					_id,
					isDeleted: null,
				},
				newModification,
				{ new: true },
			)
			.select(DB_IGNORE_FIELDS)
			.lean();
		await this.websocket.sendMessage({
			bd: 'modification',
			operation: 'update',
			id: savedModification._id.toString(),
			version: savedModification.version,
		});
		await this.logService.saveToLog({
			bd: 'modification',
			date: Date.now(),
			description: 'modification',
			operation: 'edit',
			idWorker: login,
			idSubject: savedModification._id.toString(),
		});
		this.modificationsDBService.setModification(savedModification);
		return savedModification;
	}

	async deleteModification(id: string, login: string): Promise<void> {
		const modification = this.findModificationById(id);
		console.log(modification, '\nпришли удалять modification');
		if (modification) {
			console.log('>>> и удалили, вроде');
			await this.modificationModel.findByIdAndUpdate(id, {
				isDeleted: Date.now(),
			});
			await this.websocket.sendMessage({
				bd: 'modification',
				operation: 'delete',
				id: modification._id.toString(),
				version: modification.version,
			});
			this.modificationsDBService.deleteModification(id);
			await this.logService.saveToLog({
				bd: 'modification',
				date: Date.now(),
				description: '',
				operation: 'delete',
				idWorker: login,
				idSubject: modification._id.toString(),
			});
		}
	}

	//-----------------------------------------------------------------------------
	//-----------------------------------------------------------------------------
	//                               PRIVATE METHODS
	//-----------------------------------------------------------------------------
	//-----------------------------------------------------------------------------

	private async checkExist(title: string): Promise<void> {
		const modification = await this.modificationModel.findOne({
			$or: [{ titleSlug: makeSlug(title) }, { title: title }],
		});
		if (modification) {
			throw new BadRequestException('Modification already exists');
		}
	}
}
