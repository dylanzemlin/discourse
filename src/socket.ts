import { Server } from "http";
import { v4 } from "uuid";
import ws from "ws";

declare module "ws" {
	export interface WebSocket extends ws {
		uid: string;
	}
}

const clients: Record<string, ws.WebSocket> = {};
const createSocket = (server: Server) => {
	const wss = new ws.WebSocketServer({
		noServer: true,
		path: "/socket"
	});

	// Manually handle upgrade request
	server.on("upgrade", (req, socket, head) => {
		wss.handleUpgrade(req, socket, head, (ws) => {
			wss.emit("connection", ws, req);
		});
	});

	// Broadcast a message to every connected client
	const broadcast = (data: any) => {
		wss.clients.forEach((client) => {
			if (client.readyState === ws.OPEN) {
				client.send(JSON.stringify(data));
			}
		});
	}

	wss.on("connection", (localSocket, req) => {
		// Generate a unique id for each connection!
		localSocket.uid = v4();
		clients[localSocket.uid] = localSocket;

		localSocket.on("message", (data: string) => {
			const json = JSON.parse(data);
			switch(json.id) {
				case "signal": {
					clients[json.socket_id]?.send({
						id: "signal",
						socket_id: json.socket_id,
						signal: json.signal
					})
				} break;

				case "client_connected_ack": {
					clients[json.socket_id]?.send({
						id: "client_connected_ack",
						socket_id: localSocket.uid
					});
				} break;
			}
		});

		localSocket.on("close", () => {
			delete clients[localSocket.uid];
			broadcast({
				id: "client_disconnected",
				socket_id: localSocket.uid
			});
		});

		// Init Receive
		localSocket.on("open", () => {
			broadcast({
				id: "client_connected",
				uid: localSocket.uid
			})
		});
	});

	return wss;
}

export default createSocket;