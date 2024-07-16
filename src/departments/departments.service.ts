import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import {
	IDepartment,
	IDepartmentUpdate,
} from '@/dto-schemas-interfaces/department.dto.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WebsocketService } from '@/websockets/websocket.service';
import makeSlug from '@/services/makeSlug';
import { DB_IGNORE_FIELDS } from '@/consts/db';
import {
	DepartmentsDBService,
	IDepartmentsDB,
} from '@/BD/departmentsDB.service';
import { LogService } from '@/log/log.service';

@Injectable()
export class DepartmentsService {
	constructor(
		@InjectModel(IDepartment.name)
		private departmentModel: Model<IDepartment>,
		private websocket: WebsocketService,
		private departmentsDBService: DepartmentsDBService,
		private logService: LogService,
	) {}

	/**
	 * Initializes the module by loading departments from the database.
	 */
	async onModuleInit() {
		this.departmentsDBService.departments =
			await this.loadDepartmentsFromBase();
	}

	/**
	 * Creates a new department.
	 * @param createDepartmentDto - Data transfer object containing department details.
	 * @param login - The login of the user creating the department.
	 * @returns The created department.
	 */
	async createDepartment(
		createDepartmentDto: IDepartmentUpdate,
		login: string,
	): Promise<IDepartment> {
		await this.checkExist(createDepartmentDto.title);
		createDepartmentDto.titleSlug = makeSlug(createDepartmentDto.title);
		const newDepartment =
			await this.departmentModel.create(createDepartmentDto);
		await this.notifyAndLog('create', newDepartment, login);
		this.departmentsDBService.setDepartment(newDepartment.toObject());
		return newDepartment;
	}

	/**
	 * Loads departments from the database.
	 * @returns A list of departments.
	 */
	async loadDepartmentsFromBase() {
		return this.departmentModel
			.find({ isDeleted: null }, DB_IGNORE_FIELDS)
			.lean();
	}

	/**
	 * Retrieves all departments.
	 * @returns A list of all departments.
	 */
	async findAllDepartments(): Promise<IDepartmentsDB> {
		return this.departmentsDBService.departments;
	}

	/**
	 * Finds a department by its ID.
	 * @param id - The ID of the department.
	 * @returns The department with the specified ID.
	 */
	findDepartmentById(id: string): IDepartment {
		return this.departmentsDBService.getById(id);
	}

	/**
	 * Updates an existing department.
	 * @param updateDepartment - Data transfer object containing updated department details.
	 * @param _id - ID from object containing updated department details.
	 * @param login - The login of the user updating the department.
	 * @returns The updated department.
	 */
	async updateDepartment(
		{ _id, ...updateDepartment }: IDepartmentUpdate,
		login: string,
	): Promise<IDepartment> {
		if (!_id) {
			return this.createDepartment(updateDepartment, login);
		}
		const department = await this.departmentModel.findOne(
			{
				_id,
				isDeleted: null,
			},
			DB_IGNORE_FIELDS,
		);
		if (!department) {
			throw new NotFoundException('Нет такого отдела');
		}
		const newDepartment = {
			...department.toObject(),
			...updateDepartment,
			version: department.version + 1,
		};
		if (updateDepartment.title) {
			await this.checkExist(updateDepartment.title);
			newDepartment.titleSlug = makeSlug(updateDepartment.title);
		}
		const savedDepartment = await this.departmentModel
			.findOneAndUpdate(
				{
					_id,
					isDeleted: null,
				},
				newDepartment,
				{ new: true },
			)
			.select(DB_IGNORE_FIELDS)
			.lean();
		await this.notifyAndLog('edit', savedDepartment, login);
		this.departmentsDBService.setDepartment(savedDepartment);
		return savedDepartment;
	}

	/**
	 * Deletes a department by its ID.
	 * @param id - The ID of the department to delete.
	 * @param login - The login of the user deleting the department.
	 */
	async deleteDepartment(id: string, login: string): Promise<void> {
		const department = this.findDepartmentById(id);
		if (!department) {
			throw new NotFoundException('Нет такого отдела');
		}
		const dateOfDelete = Date.now();
		await this.departmentModel.findByIdAndUpdate(id, {
			isDeleted: dateOfDelete,
		});
		await this.notifyAndLog('delete', department, login);
		this.departmentsDBService.deleteDepartment(id);
	}

	//-----------------------------------------------------------------------------
	//-----------------------------------------------------------------------------
	//                               PRIVATE METHODS
	//-----------------------------------------------------------------------------
	//-----------------------------------------------------------------------------

	/**
	 * Checks if a department with the given title already exists.
	 * @param title - The title of the department.
	 * @throws BadRequestException if a department with the given title already exists.
	 */
	private async checkExist(title: string): Promise<void> {
		const department = await this.departmentModel.findOne({
			$or: [{ titleSlug: makeSlug(title) }, { title: title }],
		});
		if (department) {
			throw new BadRequestException('Отдел уже существует');
		}
	}

	/**
	 * Sends a notification and logs the operation.
	 * @param operation - The type of operation ('create', 'edit', 'delete').
	 * @param department - The department involved in the operation.
	 * @param login - The login of the user performing the operation.
	 */
	private async notifyAndLog(
		operation: 'create' | 'edit' | 'delete',
		department: IDepartment,
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
			bd: 'departments',
			operation: websocketOperation[operation],
			id: department._id.toString(),
			version: department.version,
		});
		await this.logService.saveToLog({
			bd: 'department',
			date: Date.now(),
			description: '',
			operation,
			idWorker: login,
			idSubject: department._id.toString(),
		});
	}
}
