import { io } from "socket.io-client";

// "undefined" means the URL will be computed from the `window.location` object
const URL =
  process.env.NODE_ENV === "production"
    ? "https://memory-pkmn.onrender.com"
    : "http://192.168.1.105:5000";

console.log(URL);

export const socket = io(URL, { autoConnect: false });
