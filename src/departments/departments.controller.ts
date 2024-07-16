import {
	Body,
	Controller,
	Delete,
	Get,
	Headers,
	Param,
	Patch,
} from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import {
	IDepartment,
	IDepartmentUpdate,
} from '@/dto-schemas-interfaces/department.dto.schema';
import { isValidIdPipe } from '@/services/_mongodb_id_valiator';
import Auth from '@/services/auth';
import { IDepartmentsDB } from '@/BD/departmentsDB.service';

@Controller('departments')
export class DepartmentsController {
	constructor(private readonly departmentsService: DepartmentsService) {}

	/**
	 * Get all departments from BD object
	 */
	@Get()
	@Auth()
	async findAllDepartments(): Promise<IDepartmentsDB> {
		return this.departmentsService.findAllDepartments();
	}

	/**
	 * Update departments BD object
	 */
	@Get('update')
	@Auth('admin')
	async updateAllDepartments(): Promise<string> {
		await this.departmentsService.onModuleInit();
		return 'ok';
	}

	/**
	 * Get department by ID
	 * @param id - Department ID
	 */
	@Get(':id')
	@Auth()
	async findDepartmentById(
		@Param('id', isValidIdPipe) id: string,
	): Promise<IDepartment> {
		return this.departmentsService.findDepartmentById(id);
	}

	/**
	 * Update or create department
	 * @param updateDepartmentDto - Department update data
	 * @param login - Authenticated user's login
	 */
	@Patch()
	@Auth('admin')
	async updateDepartment(
		@Body() updateDepartmentDto: IDepartmentUpdate,
		@Headers('auth_login') login: string,
	): Promise<IDepartment> {
		return this.departmentsService.updateDepartment(
			updateDepartmentDto,
			login,
		);
	}

	/**
	 * Delete department by ID
	 * @param id - Department ID
	 * @param login - Authenticated user's login
	 */
	@Delete(':id')
	@Auth('admin')
	async deleteDepartment(
		@Param('id', isValidIdPipe) id: string,
		@Headers('auth_login') login: string,
	): Promise<void> {
		return this.departmentsService.deleteDepartment(id, login);
	}
}
