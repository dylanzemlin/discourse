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

		localSocket.on("message", (raw: string) => {
			const data = JSON.parse(raw);
			switch (data.id) {
				case "signal": {
					if (!clients[data.socket_id]) {
						return;
					}

					clients[data.socket_id]?.send(JSON.stringify({
						id: "signal",
						socket_id: localSocket.uid,
						signal: data.signal
					}))
				} break;

				case "client_connected_ack": {
					clients[data.socket_id]?.send(JSON.stringify({
						id: "client_connected_ack",
						socket_id: localSocket.uid
					}));
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

		// Tell the local client who they are
		localSocket.send(JSON.stringify({
			id: "hello",
			socket_id: localSocket.uid
		}));

		// Send everyone the new client connection deets
		for (const sock of wss.clients) {
			if (sock.uid === localSocket.uid) {
				continue;
			}

			sock.send(JSON.stringify({
				id: "client_connected",
				socket_id: localSocket.uid
			}));
		}
	});

	return wss;
}

export default createSocket;