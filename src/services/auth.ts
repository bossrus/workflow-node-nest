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

	/**
	 * Determines if the current request can be activated based on user validation.
	 * @param context - The execution context of the request.
	 * @returns A boolean indicating whether the user is valid.
	 */
	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();
		const { auth_login: _id, auth_token: loginToken }: IAuthInterface =
			request.headers;

		if (isValidMongodbId(_id)) {
			const user = await this.usersDBService.findUser(_id, loginToken);
			return user == true;
		}
		return false;
	}
}

@Injectable()
export class AdminGuard implements CanActivate {
	constructor(private usersDBService: UsersDBService) {}

	/**
	 * Determines if the current request can be activated based on admin validation.
	 * @param context - The execution context of the request.
	 * @returns A boolean indicating whether the user is an admin.
	 */
	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();
		const { auth_login: _id, auth_token: loginToken }: IAuthInterface =
			request.headers;

		const user = await this.usersDBService.findAdmin(_id, loginToken);
		return user == true;
	}
}

@Injectable()
export class ModificationGuard implements CanActivate {
	constructor(private usersDBService: UsersDBService) {}

	/**
	 * Determines if the current request can be activated based on modification permissions.
	 * @param context - The execution context of the request.
	 * @returns A boolean indicating whether the user has modification permissions.
	 */
	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();
		const { auth_login: _id, auth_token: loginToken }: IAuthInterface =
			request.headers;

		const user = await this.usersDBService.findCanModification(
			_id,
			loginToken,
		);
		return user == true;
	}
}

@Injectable()
export class StartStopGuard implements CanActivate {
	constructor(private usersDBService: UsersDBService) {}

	/**
	 * Determines if the current request can be activated based on start/stop permissions.
	 * @param context - The execution context of the request.
	 * @returns A boolean indicating whether the user has start/stop permissions.
	 */
	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();
		const { auth_login: _id, auth_token: loginToken } = request.headers;

		const user = await this.usersDBService.findStartStop(_id, loginToken);
		return user == true;
	}
}

@Injectable()
export class SeeStatisticGuard implements CanActivate {
	constructor(private usersDBService: UsersDBService) {}

	/**
	 * Determines if the current request can be activated based on see statistic permissions.
	 * @param context - The execution context of the request.
	 * @returns A boolean indicating whether the user has see statistic permissions.
	 */
	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();
		const { auth_login: _id, auth_token: loginToken }: IAuthInterface =
			request.headers;

		const user = await this.usersDBService.findCanSeeStatistic(
			_id,
			loginToken,
		);
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

/**
 * Custom decorator to apply the appropriate guard based on the role.
 * @param role - The role to determine which guard to apply.
 * @returns The decorator to apply the guard.
 */
export const Auth = (role: IRole = 'user') =>
	applyDecorators(UseGuards(RoleGuards[role]));

export default Auth;
