const express = require("express");
const router = express.Router();

// Import route files
const loginRoute = require("./loginRoute");
const registerRoute = require("./registerRoute");
const createRoomRoute = require("./createRoomRoute");
const roomsRoute = require("./roomsRoute");
const invitesRoute = require("./invitesRoute");

// Use routes
router.use("/login", loginRoute);
router.use("/register", registerRoute);
router.use("/invite", createRoomRoute);
router.use("/rooms", roomsRoute);
router.use("/invites", invitesRoute);

module.exports = router;
