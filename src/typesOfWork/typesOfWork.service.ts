import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import {
	ITypeOfWork,
	ITypeOfWorkUpdate,
} from '@/dto-schemas-interfaces/typeOfWork.dto.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WebsocketService } from '@/websockets/websocket.service';
import makeSlug from '@/services/makeSlug';
import { DB_IGNORE_FIELDS } from '@/consts/db';
import {
	ITypesOfWorkDB,
	TypesOfWorkDBService,
} from '@/BD/typesOfWorkDB.service';
import { LogService } from '@/log/log.service';

@Injectable()
export class TypesOfWorkService {
	constructor(
		@InjectModel(ITypeOfWork.name)
		private typeOfWorkModel: Model<ITypeOfWork>,
		private websocket: WebsocketService,
		private typesOfWorkDBService: TypesOfWorkDBService,
		private logService: LogService,
	) {}

	/**
	 * Initializes the module and loads types of work from the database.
	 */
	async onModuleInit() {
		this.typesOfWorkDBService.typesOfWork =
			await this.loadTypesOfWorkFromBase();
	}

	/**
	 * Creates a new type of work.
	 * @param createTypeOfWorkDto - The DTO for creating a type of work.
	 * @param login - The login of the user performing the operation.
	 * @returns The created type of work.
	 */
	async createTypeOfWork(
		createTypeOfWorkDto: ITypeOfWork,
		login: string,
	): Promise<ITypeOfWork> {
		await this.checkExist(createTypeOfWorkDto.title);
		createTypeOfWorkDto.titleSlug = makeSlug(createTypeOfWorkDto.title);
		const newTypeOfWork =
			await this.typeOfWorkModel.create(createTypeOfWorkDto);
		await this.notifyAndLog('create', newTypeOfWork, login);
		this.typesOfWorkDBService.setTypeOfWork(newTypeOfWork.toObject());
		return newTypeOfWork;
	}

	/**
	 * Loads types of work from the database.
	 * @returns The types of work from the database.
	 */
	async loadTypesOfWorkFromBase() {
		return this.typeOfWorkModel
			.find({ isDeleted: null }, DB_IGNORE_FIELDS)
			.lean();
	}

	/**
	 * Finds all types of work.
	 * @returns All types of work.
	 */
	async findAllTypesOfWork(): Promise<ITypesOfWorkDB> {
		return this.typesOfWorkDBService.typesOfWork;
	}

	/**
	 * Finds a type of work by its ID.
	 * @param id - The ID of the type of work.
	 * @returns The type of work.
	 */
	findTypeOfWorkById(id: string): ITypeOfWork {
		return this.typesOfWorkDBService.getById(id);
	}

	/**
	 * Updates a type of work.
	 * @param updateTypeOfWork - The DTO for updating a type of work.
	 * @param _id - The id of  type of work from incoming data.
	 * @param login - The login of the user performing the operation.
	 * @returns The updated type of work.
	 */
	async updateTypeOfWork(
		{ _id, ...updateTypeOfWork }: ITypeOfWorkUpdate,
		login: string,
	): Promise<ITypeOfWork> {
		if (!_id) {
			return this.createTypeOfWork(
				updateTypeOfWork as ITypeOfWork,
				login,
			);
		}
		const typeOfWork = await this.typeOfWorkModel.findOne(
			{
				_id,
				isDeleted: null,
			},
			DB_IGNORE_FIELDS,
		);
		if (!typeOfWork) {
			throw new NotFoundException('Тип работы не существует');
		}
		const newTypeOfWork = {
			...typeOfWork.toObject(),
			...updateTypeOfWork,
			version: typeOfWork.version + 1,
		};
		if (updateTypeOfWork.title) {
			await this.checkExist(updateTypeOfWork.title);
			newTypeOfWork.titleSlug = makeSlug(updateTypeOfWork.title);
		}
		const savedTypeOfWork = await this.typeOfWorkModel
			.findOneAndUpdate(
				{
					_id,
					isDeleted: null,
				},
				newTypeOfWork,
				{ new: true },
			)
			.select(DB_IGNORE_FIELDS)
			.lean();
		await this.notifyAndLog('edit', savedTypeOfWork, login);
		this.typesOfWorkDBService.setTypeOfWork(savedTypeOfWork);
		return savedTypeOfWork;
	}

	/**
	 * Deletes a type of work.
	 * @param id - The ID of the type of work.
	 * @param login - The login of the user performing the operation.
	 */
	async deleteTypeOfWork(id: string, login: string): Promise<void> {
		const typeOfWork = this.findTypeOfWorkById(id);
		if (typeOfWork) {
			const dateOfDelete = Date.now();
			await this.typeOfWorkModel.findByIdAndUpdate(id, {
				isDeleted: dateOfDelete,
			});
			await this.notifyAndLog('delete', typeOfWork, login);
			this.typesOfWorkDBService.deleteTypeOfWork(id);
		}
	}

	//-----------------------------------------------------------------------------
	//-----------------------------------------------------------------------------
	//                               PRIVATE METHODS
	//-----------------------------------------------------------------------------
	//-----------------------------------------------------------------------------

	/**
	 * Checks if a type of work with the given title already exists.
	 * @param title - The title of the type of work.
	 * @throws BadRequestException if the type of work already exists.
	 */
	private async checkExist(title: string): Promise<void> {
		const typeOfWork = await this.typeOfWorkModel.findOne({
			$or: [{ titleSlug: makeSlug(title) }, { title: title }],
		});
		if (typeOfWork) {
			throw new BadRequestException('Тип работы уже существует');
		}
	}

	/**
	 * Sends a websocket message and logs the operation.
	 * @param operation - The type of operation ('create' | 'edit' | 'delete').
	 * @param typeOfWork - The type of work object.
	 * @param login - The login of the user performing the operation.
	 */
	private async notifyAndLog(
		operation: 'create' | 'edit' | 'delete',
		typeOfWork: ITypeOfWork,
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
			bd: 'typesOfWork',
			operation: websocketOperation[operation],
			id: typeOfWork._id.toString(),
			version: typeOfWork.version,
		});
		await this.logService.saveToLog({
			bd: 'type',
			date: Date.now(),
			description: '',
			operation,
			idWorker: login,
			idSubject: typeOfWork._id.toString(),
		});
	}
}
