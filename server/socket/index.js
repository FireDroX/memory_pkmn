const {
  authenticateSocket,
  reloadSocketSession,
} = require("./authentication");

module.exports = (io, sessionMiddleware) => {
  io.engine.use(sessionMiddleware);
  io.use(authenticateSocket);
  io.on("connection", (socket) => {
    socket.join(socket.request.session.id);
    socket.use((packet, next) => reloadSocketSession(socket, packet, next));
  });

  // Import event files
  require("./userConnected")(io);
  require("./updateRoom")(io);
};
