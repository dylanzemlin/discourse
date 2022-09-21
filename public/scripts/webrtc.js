const socket = io();

socket.on("connected", (socket_id) => {

});

socket.emit("authenticate");