export interface IWebsocket {
	bd:
		| 'workflows'
		| 'users'
		| 'departments'
		| 'firms'
		| 'modifications'
		| 'typesOfWork'
		| 'invites'
		| 'flashes'
		| 'websocket';
	operation: 'update' | 'delete';
	id: string;
	version: number;
}
