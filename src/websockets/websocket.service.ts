import {
	ConnectedSocket,
	MessageBody,
	OnGatewayConnection,
	OnGatewayDisconnect,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { IWebsocket } from '@/dto-schemas-interfaces/websocket.interface';

@WebSocketGateway(3333)
export class WebsocketService
	implements OnGatewayConnection, OnGatewayDisconnect
{
	@WebSocketServer()
	server: Server;

	handleConnection(client: Socket): any {
		console.log(`Client connected: ${client.id}`);
		console.log('Login: ', client.handshake.query.login);
		console.log('Password: ', client.handshake.query.password);
		console.log('клиенты: ', this.getConnectedClients(), '\n');
	}

	handleDisconnect(client: Socket): any {
		console.log(`Client disconnected: ${client.id}`);
		console.log('клиенты: ', this.getConnectedClients());
	}

	// @SubscribeMessage('message')
	// handleMessage(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
	// const mes = `от пользователя ${client.id} получено сообщение ${data}`;
	// console.log(mes);
	// this.server.emit('servermessage', mes); //отправка всем
	// client.broadcast.emit('servermessage', data); //отправка всем, кроме автора
	// }

	async sendMessage(message: IWebsocket) {
		this.server.emit('servermessage', message); //отправка всем
	}

	private getConnectedClients() {
		return [...this.server.sockets.sockets.keys()];
	}
}
