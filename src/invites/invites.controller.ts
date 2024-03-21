import {
	Body,
	Controller,
	Delete,
	Get,
	Headers,
	Param,
	Post,
} from '@nestjs/common';
import { InvitesService } from './invites.service';
import {
	IInvitesObject,
	IInviteToJoin,
} from '@/dto-schemas-interfaces/inviteToJoin.dto.schema';
import { isValidIdPipe } from '@/services/_mongodb_id_valiator';
import { Auth } from '@/services/auth';

@Controller('invites')
export class InvitesController {
	constructor(private readonly inviteToJoinsService: InvitesService) {}

	@Post()
	@Auth()
	async createInviteToJoin(
		@Body() inviteToJoin: IInviteToJoin,
		@Headers('auth_login') login: string,
	): Promise<IInviteToJoin> {
		return this.inviteToJoinsService.createInviteToJoin(
			inviteToJoin,
			login,
		);
	}

	@Get()
	@Auth()
	async findInviteToJoinById(
		@Headers('auth_login') id: string,
	): Promise<IInvitesObject> {
		return this.inviteToJoinsService.findInviteToJoinById(id);
	}

	@Delete(':id')
	@Auth()
	async deleteInviteToJoin(
		@Param('id', isValidIdPipe) id: string,
		@Headers('auth_login') login: string,
	): Promise<void> {
		return this.inviteToJoinsService.deleteInviteToJoin(id, login);
	}

	@Delete()
	@Auth()
	async clearInvitesToJoin(
		@Headers('auth_login') login: string,
	): Promise<void> {
		return this.inviteToJoinsService.clearInvitesToJoin(login);
	}
}
