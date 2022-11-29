export enum PackageType {
  // [Server] Used to request a ping from a client
  // [Client] Used to respond to a ping from the server
  PING,

  // [Server] Used to broadcast a new chat message to all clients
  // [Client] Used to send a new chat message to the server
  SEND_CHAT,

  
  INIT,
  SIGNAL,
  CLIENT_JOINED,
  CLIENT_JOINED_ACK,
  CLIENT_DISCONNECTED
}