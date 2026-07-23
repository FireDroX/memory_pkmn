const path = require("path");
const fs = require("fs");
require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const PORT = process.env.PORT || 3001;

const server = http.createServer(app);

const io = new Server(server, {
  cors:
    process.env.NODE_ENV === "production"
      ? undefined
      : { origin: "http://localhost:5173" },
});

// Import Express routes
const routes = require("./server/express");
app.use(express.json({ limit: "1mb" }));

app.use("/api", routes);

require("./server/socket")(io);

const clientDist = path.join(__dirname, "client", "dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get("*", (_, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

server.listen(PORT, () => {
  console.log(`PokeFlip est disponible sur http://localhost:${PORT}`);
});
