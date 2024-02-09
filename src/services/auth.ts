import {
	applyDecorators,
	CanActivate,
	ExecutionContext,
	Injectable,
	UseGuards,
} from '@nestjs/common';
import { UsersDBService } from '@/BD/usersDB.service';
import { isValidMongodbId } from '@/services/_mongodb_id_valiator';
import { IAuthInterface } from '@/dto-schemas-interfaces/auth.interface';

@Injectable()
export class UserGuard implements CanActivate {
	constructor(private usersDBService: UsersDBService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();
		const { auth_login: _id, auth_token: loginToken }: IAuthInterface =
			request.headers;
		console.log('\n\n>>>validation User:');
		if (isValidMongodbId(_id)) {
			console.log('\t_id = ', _id);
			console.log('\tloginToken = ', loginToken);
			const user = await this.usersDBService.findUser(_id, loginToken);
			console.log('\tuser = ', user);
			return user == true;
		}
		return false;
	}
}

@Injectable()
export class AdminGuard implements CanActivate {
	constructor(private usersDBService: UsersDBService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();
		const { auth_login: _id, auth_token: loginToken }: IAuthInterface =
			request.headers;
		console.log('\n\n>>>validation Admin:');
		console.log('\t_id = ', _id);
		console.log('\tloginToken = ', loginToken);
		const user = await this.usersDBService.findAdmin(_id, loginToken);
		console.log('\tuser = ', user);
		return user == true;
	}
}

@Injectable()
export class ModificationGuard implements CanActivate {
	constructor(private usersDBService: UsersDBService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();
		const { auth_login: _id, auth_token: loginToken }: IAuthInterface =
			request.headers;
		console.log('\n\n>>>validation Modification:');
		const user = await this.usersDBService.findCanModification(
			_id,
			loginToken,
		);
		console.log('\tuser = ', user);
		return user == true;
	}
}

@Injectable()
export class StartStopGuard implements CanActivate {
	constructor(private usersDBService: UsersDBService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();
		const { auth_login: _id, auth_token: loginToken } = request.headers;
		console.log('\n\n>>>validation StartStop:');
		const user = await this.usersDBService.findStartStop(_id, loginToken);
		console.log('\tuser = ', user);
		return user == true;
	}
}

@Injectable()
export class SeeStatisticGuard implements CanActivate {
	constructor(private usersDBService: UsersDBService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();
		const { auth_login: _id, auth_token: loginToken }: IAuthInterface =
			request.headers;
		console.log('\n\n>>>validation StartStop:');
		const user = await this.usersDBService.findCanSeeStatistic(
			_id,
			loginToken,
		);
		console.log('\tuser = ', user);
		return user == true;
	}
}

const RoleGuards = {
	user: UserGuard,
	admin: AdminGuard,
	modification: ModificationGuard,
	startStop: StartStopGuard,
	seeStatistic: SeeStatisticGuard,
} as const;

type IRole = keyof typeof RoleGuards;

export const Auth = (role: IRole = 'user') =>
	applyDecorators(UseGuards(RoleGuards[role]));
export default Auth;
