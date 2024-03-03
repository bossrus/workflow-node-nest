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

	async onModuleInit() {
		console.log('\tзагружаю departmentsDB');
		this.departmentsDBService.departments =
			await this.loadDepartmentsFromBase();
	}

	async createDepartment(
		createDepartmentDto: IDepartmentUpdate,
		login: string,
	): Promise<IDepartment> {
		await this.checkExist(createDepartmentDto.title);
		createDepartmentDto.titleSlug = makeSlug(createDepartmentDto.title);
		const newDepartment =
			await this.departmentModel.create(createDepartmentDto);
		await this.websocket.sendMessage({
			bd: 'departments',
			operation: 'update',
			id: newDepartment._id.toString(),
			version: newDepartment.version,
		});
		await this.logService.saveToLog({
			bd: 'department',
			date: Date.now(),
			description: '',
			operation: 'create',
			idWorker: login,
			idSubject: newDepartment._id.toString(),
		});
		this.departmentsDBService.setDepartment(newDepartment.toObject());
		return newDepartment;
	}

	async loadDepartmentsFromBase() {
		return this.departmentModel
			.find({ isDeleted: null }, DB_IGNORE_FIELDS)
			.lean();
	}

	async findAllDepartments(): Promise<IDepartmentsDB> {
		return this.departmentsDBService.departments;
	}

	findDepartmentById(id: string): IDepartment {
		return this.departmentsDBService.getById(id);
	}

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
		await this.websocket.sendMessage({
			bd: 'departments',
			operation: 'update',
			id: savedDepartment._id.toString(),
			version: savedDepartment.version,
		});
		await this.logService.saveToLog({
			bd: 'department',
			date: Date.now(),
			description: '',
			operation: 'edit',
			idWorker: login,
			idSubject: savedDepartment._id.toString(),
		});
		this.departmentsDBService.setDepartment(savedDepartment);
		return savedDepartment;
	}

	async deleteDepartment(id: string, login: string): Promise<void> {
		const department = this.findDepartmentById(id);
		console.log(department, '\nпришли удалять department');
		if (department) {
			console.log('>>> и удалили, вроде');
			const dateOfDelete = Date.now();
			await this.departmentModel.findByIdAndUpdate(id, {
				isDeleted: dateOfDelete,
			});
			await this.websocket.sendMessage({
				bd: 'departments',
				operation: 'delete',
				id: department._id.toString(),
				version: department.version,
			});
			this.departmentsDBService.deleteDepartment(id);

			await this.logService.saveToLog({
				bd: 'department',
				date: Date.now(),
				description: '',
				operation: 'delete',
				idWorker: login,
				idSubject: department._id.toString(),
			});
		}
	}

	//-----------------------------------------------------------------------------
	//-----------------------------------------------------------------------------
	//                               PRIVATE METHODS
	//-----------------------------------------------------------------------------
	//-----------------------------------------------------------------------------

	private async checkExist(title: string): Promise<void> {
		const department = await this.departmentModel.findOne({
			$or: [{ titleSlug: makeSlug(title) }, { title: title }],
		});
		if (department) {
			throw new BadRequestException('Отдел уже существует');
		}
	}
}
