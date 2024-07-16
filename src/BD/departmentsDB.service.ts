import { Injectable } from '@nestjs/common';
import { IDepartment } from '@/dto-schemas-interfaces/department.dto.schema';

import { FIELDS_TO_DELETE } from '@/consts/db';

export interface IDepartmentsDB {
	[key: string]: IDepartment;
}

@Injectable()
export class DepartmentsDBService {
	private _departments: IDepartmentsDB = {};

	get departments(): IDepartmentsDB {
		return this._departments;
	}

	set departments(departments: IDepartment[]) {
		this._departments = {};
		departments.forEach((department) => {
			this._departments[department._id] = department;
		});
	}

	setDepartment(department: IDepartment) {
		FIELDS_TO_DELETE.forEach((property) => {
			if (department[property]) {
				delete department[property];
			}
		});
		this._departments[department._id] = department;
	}

	getById(id: string): IDepartment {
		return this._departments[id];
	}

	delete(id: string) {
		return delete this._departments[id];
	}

	getTitle(id: string) {
		return this.departments[id].title;
	}

	deleteDepartment(id: string) {
		delete this._departments[id];
	}
}
