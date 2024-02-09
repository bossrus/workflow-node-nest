export interface IMailList {
	[modificationAndFirm: string]: {
		modificationTitle: string;
		firmTitle: string;
		titles: string[];
	};
}

export interface IMailListByDepartments {
	[departmentTitle: string]: {
		departmentId: string;
		mailList: IMailList;
	};
}
