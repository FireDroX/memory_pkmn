const { createClient } = require("@supabase/supabase-js");

const path = require("path");
require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin:
      process.env.NODE_ENV === "production"
        ? undefined
        : "http://192.168.1.105:3000",
  },
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Import Express routes
const routes = require("./server/express");
app.use(express.json());

app.use(express.static("client/build"));

app.use("/", routes);

require("./server/socket")(io);

app.get("/*", (_, res) => {
  res.sendFile(path.join(__dirname, "./client/build/index.html"));
});

server.listen(5000, () => {
  console.log(`Listening on port : ${PORT}`);
});
