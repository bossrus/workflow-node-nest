import {
	Body,
	Controller,
	Delete,
	Get,
	Headers,
	Param,
	Patch,
	Post,
} from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import {
	IDepartment,
	IDepartmentUpdate,
} from '@/dto-schemas-interfaces/department.dto.schema';
import { isValidIdPipe } from '@/services/_mongodb_id_valiator';
import Auth from '@/services/auth';

@Controller('departments')
export class DepartmentsController {
	constructor(private readonly departmentsService: DepartmentsService) {}

	@Post()
	@Auth('admin')
	async createDepartment(
		@Body() department: IDepartment,
		@Headers('auth_login') login: string,
	): Promise<IDepartment> {
		return this.departmentsService.createDepartment(department, login);
	}

	@Get()
	@Auth()
	async findAllDepartments(): Promise<IDepartment[]> {
		return this.departmentsService.findAllDepartments();
	}

	@Get(':id')
	@Auth()
	async findDepartmentById(
		@Param('id', isValidIdPipe) id: string,
	): Promise<IDepartment> {
		return this.departmentsService.findDepartmentById(id);
	}

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

	@Delete(':id')
	@Auth('admin')
	async deleteDepartment(
		@Param('id', isValidIdPipe) id: string,
		@Headers('auth_login') login: string,
	): Promise<void> {
		return this.departmentsService.deleteDepartment(id, login);
	}
}
