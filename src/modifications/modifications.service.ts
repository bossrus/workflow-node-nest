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
import {
	IModificationsDB,
	ModificationsDBService,
} from '@/BD/modificationsDB.service';
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

	/**
	 * Initializes the modifications database on module initialization.
	 */
	async onModuleInit() {
		this.modificationsDBService.modifications =
			await this.loadModificationsFromBase();
	}

	/**
	 * Creates a new modification.
	 * @param createModificationDto - The modification data transfer object.
	 * @param login - The login of the user creating the modification.
	 * @returns The created modification.
	 */
	async createModification(
		createModificationDto: IModification,
		login: string,
	): Promise<IModification> {
		await this.checkExist(createModificationDto.title);
		createModificationDto.titleSlug = makeSlug(createModificationDto.title);
		const newModification = await this.modificationModel.create(
			createModificationDto,
		);
		await this.notifyAndLog('create', newModification, login);
		this.modificationsDBService.setModification(newModification.toObject());
		return newModification;
	}

	/**
	 * Loads all modifications from the database.
	 * @returns A list of modifications.
	 */
	async loadModificationsFromBase() {
		return this.modificationModel
			.find({ isDeleted: null }, DB_IGNORE_FIELDS)
			.lean();
	}

	/**
	 * Finds all modifications.
	 * @returns The modifications database.
	 */
	async findAllModifications(): Promise<IModificationsDB> {
		return this.modificationsDBService.modifications;
	}

	/**
	 * Finds a modification by its ID.
	 * @param id - The ID of the modification.
	 * @returns The modification.
	 */
	findModificationById(id: string): IModification {
		return this.modificationsDBService.getById(id);
	}

	/**
	 * Updates an existing modification.
	 * @param updateModification - The modification update data transfer object.
	 * @param _id - The id modification from update data transfer object
	 * @param login - The login of the user updating the modification.
	 * @returns The updated modification.
	 */
	async updateModification(
		{ _id, ...updateModification }: IModificationUpdate,
		login: string,
	): Promise<IModification> {
		if (!_id) {
			return this.createModification(
				updateModification as IModification,
				login,
			);
		}
		const modification = await this.modificationModel.findOne(
			{ _id, isDeleted: null },
			DB_IGNORE_FIELDS,
		);
		if (!modification) {
			throw new NotFoundException('Нет такого номера журнала');
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
			.findOneAndUpdate({ _id, isDeleted: null }, newModification, {
				new: true,
			})
			.select(DB_IGNORE_FIELDS)
			.lean();
		await this.notifyAndLog('edit', savedModification, login);
		this.modificationsDBService.setModification(savedModification);
		return savedModification;
	}

	/**
	 * Deletes a modification by its ID.
	 * @param id - The ID of the modification.
	 * @param login - The login of the user deleting the modification.
	 */
	async deleteModification(id: string, login: string): Promise<void> {
		const modification = this.findModificationById(id);
		if (modification) {
			await this.modificationModel.findByIdAndUpdate(id, {
				isDeleted: Date.now(),
			});
			await this.notifyAndLog('delete', modification, login);
			this.modificationsDBService.deleteModification(id);
		}
	}

	//-----------------------------------------------------------------------------
	//-----------------------------------------------------------------------------
	//                               PRIVATE METHODS
	//-----------------------------------------------------------------------------
	//-----------------------------------------------------------------------------

	/**
	 * Checks if a modification with the given title already exists.
	 * @param title - The title of the modification.
	 * @throws BadRequestException if a modification with the given title already exists.
	 */
	private async checkExist(title: string): Promise<void> {
		const modification = await this.modificationModel.findOne({
			$or: [{ titleSlug: makeSlug(title) }, { title: title }],
		});
		if (modification) {
			throw new BadRequestException('Такой номер журнала уже существует');
		}
	}

	/**
	 * Sends a websocket message and logs the operation.
	 * @param operation - The type of operation ('create' | 'edit' | 'delete').
	 * @param modification - The modification object.
	 * @param login - The login of the user performing the operation.
	 */
	private async notifyAndLog(
		operation: 'create' | 'edit' | 'delete',
		modification: IModification,
		login: string,
	): Promise<void> {
		const websocketOperation: Record<
			'create' | 'edit' | 'delete',
			'delete' | 'update'
		> = {
			create: 'update',
			edit: 'update',
			delete: 'delete',
		};
		await this.websocket.sendMessage({
			bd: 'modifications',
			operation: websocketOperation[operation],
			id: modification._id.toString(),
			version: modification.version,
		});
		await this.logService.saveToLog({
			bd: 'modification',
			date: Date.now(),
			description: 'modification',
			operation,
			idWorker: login,
			idSubject: modification._id.toString(),
		});
	}
}
