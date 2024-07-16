import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { IFirm, IFirmUpdate } from '@/dto-schemas-interfaces/firm.dto.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WebsocketService } from '@/websockets/websocket.service';
import makeSlug from '@/services/makeSlug';
import { DB_IGNORE_FIELDS } from '@/consts/db';
import { FirmsDBService, IFirmsDB } from '@/BD/firmsDB.service';
import { LogService } from '@/log/log.service';

@Injectable()
export class FirmsService {
	constructor(
		@InjectModel(IFirm.name)
		private firmModel: Model<IFirm>,
		private websocket: WebsocketService,
		private firmsDBService: FirmsDBService,
		private logService: LogService,
	) {}

	/**
	 * Initialize the service by loading firms from the database.
	 */
	async onModuleInit() {
		this.firmsDBService.firms = await this.loadFirmsFromBase();
	}

	/**
	 * Create a new firm and log the operation.
	 * @param createFirmDto - Data Transfer Object for creating a firm.
	 * @param login - The login of the user performing the operation.
	 * @returns The created firm.
	 */
	async createFirm(createFirmDto: IFirm, login: string): Promise<IFirm> {
		await this.checkExist(createFirmDto.title);
		createFirmDto.titleSlug = makeSlug(createFirmDto.title);
		const newFirm = await this.firmModel.create(createFirmDto);
		await this.notifyAndLog('edit', newFirm, login);
		this.firmsDBService.setFirm(newFirm.toObject());
		return newFirm;
	}

	/**
	 * Load firms from the database.
	 * @returns A list of firms.
	 */
	async loadFirmsFromBase() {
		return this.firmModel
			.find({ isDeleted: null }, DB_IGNORE_FIELDS)
			.lean();
	}

	/**
	 * Find all firms.
	 * @returns A list of all firms.
	 */
	async findAllFirms(): Promise<IFirmsDB> {
		return this.firmsDBService.firms;
	}

	/**
	 * Find a firm by its ID.
	 * @param id - The ID of the firm.
	 * @returns The firm if found.
	 */
	findFirmById(id: string): IFirm {
		return this.firmsDBService.getById(id);
	}

	/**
	 * Update an existing firm or create a new one if it doesn't exist.
	 * @param updateFirm - Data Transfer Object for updating a firm.
	 * @param _id - ID from Object for updating a firm.
	 * @param login - The login of the user performing the operation.
	 * @returns The updated or created firm.
	 */
	async updateFirm(
		{ _id, ...updateFirm }: IFirmUpdate,
		login: string,
	): Promise<IFirm> {
		if (!_id) {
			return this.createFirm(updateFirm as IFirm, login);
		}
		const firm = await this.firmModel.findOne(
			{ _id, isDeleted: null },
			DB_IGNORE_FIELDS,
		);
		if (!firm) {
			throw new NotFoundException('Нет такого клиента');
		}
		const newFirm = {
			...firm.toObject(),
			...updateFirm,
			version: firm.version + 1,
		};
		if (updateFirm.title) {
			await this.checkExist(updateFirm.title);
			newFirm.titleSlug = makeSlug(updateFirm.title);
		}
		const savedFirm = await this.firmModel
			.findOneAndUpdate({ _id, isDeleted: null }, newFirm, { new: true })
			.select(DB_IGNORE_FIELDS)
			.lean();
		await this.notifyAndLog('edit', savedFirm, login);
		this.firmsDBService.setFirm(savedFirm);
		return savedFirm;
	}

	/**
	 * Delete a firm by its ID and log the operation.
	 * @param id - The ID of the firm.
	 * @param login - The login of the user performing the operation.
	 */
	async deleteFirm(id: string, login: string): Promise<void> {
		const firm = this.findFirmById(id);
		if (firm) {
			const dateOfDelete = Date.now();
			await this.firmModel.findByIdAndUpdate(id, {
				isDeleted: dateOfDelete,
			});
			this.firmsDBService.deleteFirm(id);
			await this.notifyAndLog('edit', firm, login);
		}
	}

	//-----------------------------------------------------------------------------
	//-----------------------------------------------------------------------------
	//                               PRIVATE METHODS
	//-----------------------------------------------------------------------------
	//-----------------------------------------------------------------------------

	/**
	 * Check if a firm with the given title already exists.
	 * @param title - The title of the firm.
	 * @throws BadRequestException if the firm already exists.
	 */
	private async checkExist(title: string): Promise<void> {
		const firm = await this.firmModel.findOne({
			$or: [{ titleSlug: makeSlug(title) }, { title: title }],
		});
		if (firm) {
			throw new BadRequestException('Фирма уже существует');
		}
	}

	/**
	 * Sends a notification and logs the operation.
	 * @param operation - The type of operation ('create', 'edit', 'delete').
	 * @param firm - The firm involved in the operation.
	 * @param login - The login of the user performing the operation.
	 */
	private async notifyAndLog(
		operation: 'create' | 'edit' | 'delete',
		firm: IFirm,
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
			bd: 'firms',
			operation: websocketOperation[operation],
			id: firm._id.toString(),
			version: firm.version,
		});
		await this.logService.saveToLog({
			bd: 'firm',
			date: Date.now(),
			description: '',
			operation,
			idWorker: login,
			idSubject: firm._id.toString(),
		});
	}
}
