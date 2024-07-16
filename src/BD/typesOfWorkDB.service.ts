import { Injectable } from '@nestjs/common';
import { ITypeOfWork } from '@/dto-schemas-interfaces/typeOfWork.dto.schema';
import { FIELDS_TO_DELETE } from '@/consts/db';

export interface ITypesOfWorkDB {
	[key: string]: ITypeOfWork;
}

@Injectable()
export class TypesOfWorkDBService {
	private _typesOfWork: ITypesOfWorkDB = {};

	get typesOfWork(): ITypesOfWorkDB {
		return this._typesOfWork;
	}

	set typesOfWork(typesOfWork: ITypeOfWork[]) {
		this._typesOfWork = {};
		typesOfWork.forEach((typeOfWork) => {
			this._typesOfWork[typeOfWork._id] = typeOfWork;
		});
	}

	setTypeOfWork(typeOfWork: ITypeOfWork) {
		FIELDS_TO_DELETE.forEach((property) => {
			if (typeOfWork[property]) {
				delete typeOfWork[property];
			}
		});
		this._typesOfWork[typeOfWork._id] = typeOfWork;
	}

	getById(id: string): ITypeOfWork {
		return this._typesOfWork[id];
	}

	deleteTypeOfWork(id: string) {
		delete this._typesOfWork[id];
	}
}
