const authenticateSocket = (socket, next) => {
  const user = socket.request.session?.user;
  if (!user?.id || !user?.name) {
    return next(new Error("Authentification requise."));
  }

  socket.data.user = user;
  return next();
};

const reloadSocketSession = (socket, _packet, next) => {
  socket.request.session.reload((error) => {
    const user = socket.request.session?.user;
    if (error || !user?.id || !user?.name) {
      socket.disconnect();
      return;
    }

    socket.data.user = user;
    next();
  });
};

module.exports = { authenticateSocket, reloadSocketSession };
