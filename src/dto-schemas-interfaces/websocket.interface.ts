export interface IWebsocket {
	bd:
		| 'user'
		| 'modification'
		| 'department'
		| 'firm'
		| 'invite'
		| 'type'
		| 'flash'
		| 'workflow';
	operation: 'update' | 'delete';
	id: string;
	version: number;
}
