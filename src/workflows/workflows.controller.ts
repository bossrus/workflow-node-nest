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
import { WorkflowsService } from './workflows.service';
import {
	IWorkflow,
	IWorkflowsObject,
	IWorkflowUpdate,
} from '@/dto-schemas-interfaces/workflow.dto.schema';
import { isValidIdPipe } from '@/services/_mongodb_id_valiator';
import Auth from '@/services/auth';
import { IMongoIdArray } from '@/dto-schemas-interfaces/mongoIds.dto.schema';
import { IStatParameters } from '@/dto-schemas-interfaces/statistic.interface';

@Controller('workflows')
export class WorkflowsController {
	constructor(private readonly workflowsService: WorkflowsService) {}

	/**
	 * Get all workflows.
	 * @returns {Promise<IWorkflowsObject>} A promise that resolves to an object containing all workflows.
	 */
	@Get()
	@Auth()
	async findAllWorkflows(): Promise<IWorkflowsObject> {
		return this.workflowsService.findAllWorkflows();
	}

	/**
	 * Get all workflows for a specific firm and modification.
	 * @param {IWorkflowUpdate} param0 - The firm and modification details.
	 * @returns {Promise<IWorkflow[]>} A promise that resolves to an array of workflows.
	 */
	@Post('in_this_modification')
	@Auth('startStop')
	async findAllWorkflowsInThisModification(
		@Body() { firm, modification }: IWorkflowUpdate,
	): Promise<IWorkflow[]> {
		return this.workflowsService.findAllWorkflowsInThisModification({
			firm,
			modification,
		});
	}

	/**
	 * Get a workflow by its ID.
	 * @param {string} id - The ID of the workflow.
	 * @returns {Promise<IWorkflow>} A promise that resolves to the workflow.
	 */
	@Get(':id')
	@Auth()
	async findWorkflowById(
		@Param('id', isValidIdPipe) id: string,
	): Promise<IWorkflow> {
		return this.workflowsService.findWorkflowById(id);
	}

	/**
	 * Update a workflow.
	 * @param {IWorkflowUpdate} updateWorkflowDto - The workflow update details.
	 * @param {string} login - The login of the user making the request.
	 * @returns {Promise<IWorkflow>} A promise that resolves to the updated workflow.
	 */
	@Patch()
	@Auth('startStop')
	async updateWorkflow(
		@Body() updateWorkflowDto: IWorkflowUpdate,
		@Headers('authlogin') login: string,
	): Promise<IWorkflow> {
		return this.workflowsService.updateWorkflow(updateWorkflowDto, login);
	}

	/**
	 * Publish workflows.
	 * @param {IMongoIdArray} workflowIds - The IDs of the workflows to publish.
	 * @param {string} login - The login of the user making the request.
	 * @returns {Promise<string>} A promise that resolves to a success message.
	 */
	@Patch('publish')
	@Auth('startStop')
	async publishWorkflow(
		@Body() workflowIds: IMongoIdArray,
		@Headers('authlogin') login: string,
	): Promise<string> {
		return this.workflowsService.publishWorkflow(workflowIds, login);
	}

	/**
	 * Mark workflows as checked.
	 * @param {IMongoIdArray} workflowIds - The IDs of the workflows to mark as checked.
	 * @param {string} login - The login of the user making the request.
	 * @returns {Promise<string>} A promise that resolves to a success message.
	 */
	@Patch('checked')
	@Auth('seeStatistic')
	async checkedWorkflow(
		@Body() workflowIds: IMongoIdArray,
		@Headers('authlogin') login: string,
	): Promise<string> {
		return this.workflowsService.checkedWorkflow(workflowIds, login);
	}

	/**
	 * Add text to the description of a workflow.
	 * @param {string} text - The text to add to the description.
	 * @param {string} id - The ID of the workflow.
	 * @param {string} login - The login of the user making the request.
	 * @returns {Promise<IWorkflow>} A promise that resolves to the updated workflow.
	 */
	@Patch('description/:id')
	@Auth('startStop')
	async addToDescription(
		@Body() text: string,
		@Param('id', isValidIdPipe) id: string,
		@Headers('authlogin') login: string,
	): Promise<IWorkflow> {
		return this.workflowsService.addToDescription(id, text, login);
	}

	/**
	 * Take workflows into work.
	 * @param {IMongoIdArray} workflowIds - The IDs of the workflows to take into work.
	 * @param {string} login - The login of the user making the request.
	 * @returns {Promise<boolean>} A promise that resolves to a boolean indicating success.
	 */
	@Patch('take')
	@Auth()
	async takeInWork(
		@Body() workflowIds: IMongoIdArray,
		@Headers('authlogin') login: string,
	): Promise<boolean> {
		return this.workflowsService.takeToWork(workflowIds, login);
	}

	/**
	 * Close a workflow and move it to a new department.
	 * @param {Record<string, string>} newDepartment - The new department details.
	 * @param {string} id - The ID of the workflow.
	 * @param {string} login - The login of the user making the request.
	 * @returns {Promise<IWorkflow>} A promise that resolves to the updated workflow.
	 */
	@Patch('close/:id')
	@Auth()
	async closeWork(
		@Body() newDepartment: Record<string, string>,
		@Param('id', isValidIdPipe) id: string,
		@Headers('authlogin') login: string,
	): Promise<IWorkflow> {
		return this.workflowsService.closeWork(
			id,
			login,
			newDepartment.newDepartment,
		);
	}

	/**
	 * Show statistics for workflows.
	 * @param {IStatParameters} statParameters - The parameters for the statistics.
	 * @param {string} id - The ID of the workflow (optional).
	 * @returns {Promise<any>} A promise that resolves to the statistics.
	 */
	@Post('stat/:id?')
	@Auth('seeStatistic')
	async showStatistic(
		@Body() statParameters: IStatParameters,
		@Param('id', isValidIdPipe) id: string,
	) {
		return this.workflowsService.showStatistic(statParameters, id);
	}

	/**
	 * Delete a workflow by its ID.
	 * @param {string} id - The ID of the workflow.
	 * @param {string} login - The login of the user making the request.
	 * @returns {Promise<void>} A promise that resolves when the workflow is deleted.
	 */
	@Delete(':id')
	@Auth('startStop')
	async deleteWorkflow(
		@Param('id', isValidIdPipe) id: string,
		@Headers('authlogin') login: string,
	): Promise<void> {
		return this.workflowsService.deleteWorkflow(id, login);
	}
}
