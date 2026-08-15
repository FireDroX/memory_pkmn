const path = require("path");
const fs = require("fs");
require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const {
  createSessionMiddleware,
  createSessionStore,
} = require("./server/session");

const app = express();
const PORT = process.env.PORT || 3000;

const server = http.createServer(app);
const sessionStore = createSessionStore();
const sessionMiddleware = createSessionMiddleware({ store: sessionStore });

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

const io = new Server(server, {
  cors:
    process.env.NODE_ENV === "production"
      ? undefined
      : { origin: "http://localhost:5173" },
});

// Import Express routes
const routes = require("./server/express");
app.use(express.json({ limit: "1mb" }));
app.use(sessionMiddleware);

app.use("/api", routes);

require("./server/socket")(io);

const clientDist = path.join(__dirname, "client", "dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get("*", (_, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

const startServer = async () => {
  await sessionStore.onReady();
  server.listen(PORT, () => {
    console.log(`PokeFlip est disponible sur http://localhost:${PORT}`);
  });
};

startServer().catch((error) => {
  console.error("Impossible d'initialiser les sessions MySQL :", error);
  process.exitCode = 1;
});
