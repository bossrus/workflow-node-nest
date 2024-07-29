import {
	OnGatewayConnection,
	OnGatewayDisconnect,
	WebSocketGateway,
	WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { IWebsocket } from '@/dto-schemas-interfaces/websocket.interface';
import { UsersDBService } from '@/BD/usersDB.service';

@WebSocketGateway(3333, { cors: true })
export class WebsocketService
	implements OnGatewayConnection, OnGatewayDisconnect
{
	@WebSocketServer()
	server: Server;

	constructor(private usersDBService: UsersDBService) {
		console.log('Websocket started');
	}

	async handleConnection(client: Socket): Promise<void> {
		const login = client.handshake.query.login as string;
		const token = client.handshake.query.loginToken as string;

		const user = await this.usersDBService.findUser(login, token);

		if (!user) {
			client.disconnect();
		} else {
			await this.sendMessage({
				bd: 'websocket',
				operation: 'update',
				id: JSON.stringify(await this.getConnectedClients()),
				version: 0,
			});
		}
	}

	async handleDisconnect(): Promise<void> {
		await this.sendMessageToAnywhere({
			bd: 'websocket',
			operation: 'update',
			id: JSON.stringify(await this.getConnectedClients()),
			version: 0,
		});
	}

	async sendMessage(message: IWebsocket) {
		// console.log('отсылка сообщения в сокет', message);
		if (message.bd === 'flashes' || message.bd === 'invites') {
			await this.sendMessageToUser(message);
		} else {
			await this.sendMessageToAnywhere(message);
		}
	}

	async sendMessageToUser(message: IWebsocket) {
		const client = [...this.server.sockets.sockets.values()].find(
			(socket) => socket.handshake.query.login === message.id,
		);
		if (client) {
			client.emit('servermessage', message);
		}
	}

	private async sendMessageToAnywhere(message: IWebsocket) {
		this.server.emit('servermessage', message); //отправка всем
	}

	private async getConnectedClients() {
		const online: string[] = [];
		[...this.server.sockets.sockets.values()].forEach((socket) => {
			const login = socket.handshake.query.login as string;
			if (!online.includes(login)) online.push(login);
		});
		return online;
	}
}
