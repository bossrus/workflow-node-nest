import {
	Body,
	Controller,
	Delete,
	Get,
	Headers,
	Param,
	Patch,
} from '@nestjs/common';
import { WorkflowsService } from './workflows.service';
import {
	IWorkflow,
	IWorkflowUpdate,
} from '@/dto-schemas-interfaces/workflow.dto.schema';
import { isValidIdPipe } from '@/services/_mongodb_id_valiator';
import Auth from '@/services/auth';
import { IMongoIdArray } from '@/dto-schemas-interfaces/mongoIds.dto.schema';

@Controller('workflows')
export class WorkflowsController {
	constructor(private readonly workflowsService: WorkflowsService) {}

	@Get()
	@Auth()
	async findAllWorkflows(): Promise<IWorkflow[]> {
		return this.workflowsService.findAllWorkflows();
	}

	@Get(':id')
	@Auth()
	async findWorkflowById(
		@Param('id', isValidIdPipe) id: string,
	): Promise<IWorkflow> {
		return this.workflowsService.findWorkflowById(id);
	}

	@Patch()
	@Auth('startStop')
	async updateWorkflow(
		@Body() updateWorkflowDto: IWorkflowUpdate,
		@Headers('auth_login') login: string,
	): Promise<IWorkflow> {
		return this.workflowsService.updateWorkflow(updateWorkflowDto, login);
	}

	@Patch('publish')
	@Auth('startStop')
	async publishWorkflow(
		@Body() workflowIds: IMongoIdArray,
		@Headers('auth_login') login: string,
	): Promise<IWorkflow> {
		return this.workflowsService.publishWorkflow(workflowIds, login);
	}

	@Patch('checked')
	@Auth('seeStatistic')
	async checkedWorkflow(
		@Body() workflowIds: IMongoIdArray,
		@Headers('auth_login') login: string,
	): Promise<IWorkflow> {
		return this.workflowsService.publishWorkflow(workflowIds, login);
	}

	@Patch('description/:id')
	@Auth('startStop')
	async addToDescription(
		@Body() text: string,
		@Param('id', isValidIdPipe) id: string,
		@Headers('auth_login') login: string,
	): Promise<IWorkflow> {
		return this.workflowsService.addToDescription(id, text, login);
	}

	@Patch('take')
	@Auth()
	async takeInWork(
		@Body() workflowIds: IMongoIdArray,
		@Headers('auth_login') login: string,
	): Promise<boolean> {
		return this.workflowsService.takeToWork(workflowIds, login);
	}

	@Patch('close/:id')
	@Auth()
	async closeWork(
		@Body() newDepartment: string,
		@Param('id', isValidIdPipe) id: string,
		@Headers('auth_login') login: string,
	): Promise<IWorkflow> {
		return this.workflowsService.closeWork(id, login, newDepartment);
	}

	@Delete(':id')
	@Auth('startStop')
	async deleteWorkflow(
		@Param('id', isValidIdPipe) id: string,
		@Headers('auth_login') login: string,
	): Promise<void> {
		return this.workflowsService.deleteWorkflow(id, login);
	}
}
