import { Server as IOServer } from "socket.io";
import { Server } from "http";

const createSocket = (server: Server) => {
	const io = new IOServer(server);
	
	const peers: any = {};
	io.on("connection", (client) => {
		peers[client.id] = client;
	
		for(const id in peers) {
			if(id === client.id) continue;
	
			peers[id].emit("initReceive", client.id);
		}
	
		client.on("signal", (data) => {
			console.log("signal: " + client.id + " to " + data);
			peers[data.socket_id]?.emit("signal", {
				socket_id: client.id,
				signal: data.signal
			});
		});
	
		client.on("disconnect", () => {
			console.log("disconnect: " + client.id);
			client.broadcast.emit("removePeer", client.id);
			delete peers[client.id];
		});
	
		client.on("initSend", init_socket_id => {
			peers[init_socket_id].emit("initSend", client.id);
		});
	});
}

export default createSocket;