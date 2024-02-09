import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
	DepartmentSchema,
	IDepartment,
} from '@/dto-schemas-interfaces/department.dto.schema';
import { DepartmentsController } from '@/departments/departments.controller';
import { DepartmentsService } from '@/departments/departments.service';
import { DbModule } from '@/BD/db.module';
import { LogModule } from '@/log/log.module';
import { WebsocketModule } from '@/websockets/websocket.module';

@Module({
	imports: [
		MongooseModule.forFeature([
			{
				name: IDepartment.name,
				schema: DepartmentSchema,
			},
		]),
		DbModule,
		LogModule,
		WebsocketModule,
	],
	controllers: [DepartmentsController],
	providers: [DepartmentsService],
})
export class DepartmentsModule {}
