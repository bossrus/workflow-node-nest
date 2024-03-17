import {
	Body,
	Controller,
	Delete,
	Get,
	Headers,
	Param,
	Patch,
	Post,
	Redirect,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { IUser, IUserUpdate } from '@/dto-schemas-interfaces/user.dto.schema';
import { isValidIdPipe } from '@/services/_mongodb_id_valiator';
import Auth from '@/services/auth';
import { IUsersDB } from '@/BD/usersDB.service';
import {
	CONTROL_PANEL_FRONT,
	WRONG_EMAIL_TOKEN_PAGE,
} from '@/consts/serveresAddresses';

// import Auth from '@/services/auth';

@Controller('users')
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@Post('login')
	async loginUser(@Body() loginUserDto: IUserUpdate) {
		return this.usersService.loginUser(loginUserDto);
	}

	@Get('auth')
	@Auth()
	async getAuthUser(
		@Headers('auth_login') login: string,
		@Headers('auth_token') token: string,
	) {
		return this.usersService.getAuthUser(login, token);
	}

	@Get('admin/:id')
	@Auth('admin')
	async findUserByIdAdmin(
		@Param('id', isValidIdPipe) id: string,
	): Promise<IUserUpdate> {
		return this.usersService.findUserByIdAdmin(id);
	}

	@Get('admin')
	@Auth('admin')
	async findAllUsersAdmin(): Promise<IUsersDB> {
		return this.usersService.findAllUsersAdmin();
	}

	@Get()
	@Auth()
	async findAllUsers(): Promise<IUsersDB> {
		return this.usersService.findAllUsers();
	}

	@Get('confirmEmail/:id/:token')
	@Redirect()
	async confirmEmail(
		@Param('id', isValidIdPipe) id: string,
		@Param('token') token: string,
	): Promise<{ url: string }> {
		const relink = (await this.usersService.confirmEmail(id, token))
			? CONTROL_PANEL_FRONT
			: WRONG_EMAIL_TOKEN_PAGE;
		return { url: relink };
	}

	@Get(':id')
	@Auth()
	async findUserById(
		@Param('id', isValidIdPipe) id: string,
	): Promise<IUserUpdate> {
		return this.usersService.findUserById(id);
	}

	@Get('me/:id')
	@Auth()
	async showMe(
		@Param('id', isValidIdPipe) id: string,
		@Headers('auth_login') login: string,
	): Promise<IUserUpdate> {
		return this.usersService.showMe(id, login);
	}

	@Patch()
	@Auth('admin')
	async updateUser(
		@Body() updateUserDto: IUserUpdate,
		@Headers('auth_login') login: string,
	): Promise<IUser> {
		return this.usersService.updateUser(updateUserDto, login);
	}

	@Patch('email')
	@Auth()
	async updateUsersEmail(
		@Body() updateUserDto: IUserUpdate,
		@Headers('auth_login') login: string,
	): Promise<boolean> {
		return this.usersService.updateUsersEmail(updateUserDto, login);
	}

	@Patch('me')
	@Auth()
	async updateMe(
		@Body() updateUserDto: IUserUpdate,
		@Headers('auth_login') login: string,
	): Promise<IUser> {
		return this.usersService.updateMe(updateUserDto, login);
	}

	@Delete(':id')
	@Auth('admin')
	async deleteUser(
		@Param('id', isValidIdPipe) id: string,
		@Headers('auth_login') login: string,
	): Promise<void> {
		return this.usersService.deleteUser(id, login);
	}
}
