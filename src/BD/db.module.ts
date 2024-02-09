import { DepartmentsDBService } from '@/BD/departmentsDB.service';
import { UsersDBService } from '@/BD/usersDB.service';
import { Global, Module } from '@nestjs/common';
import { ModificationsDBService } from '@/BD/modificationsDB.service';
import { FirmsDBService } from '@/BD/firmsDB.service';
import { WorktypesDBService } from '@/BD/worktypesDB.service';

@Global()
@Module({
	providers: [
		DepartmentsDBService,
		UsersDBService,
		ModificationsDBService,
		FirmsDBService,
		WorktypesDBService,
	],
	exports: [
		DepartmentsDBService,
		UsersDBService,
		ModificationsDBService,
		FirmsDBService,
		WorktypesDBService,
	],
})
export class DbModule {}
