const express = require("express");
const router = express.Router();

// Import route files
const loginRoute = require("./loginRoute");
const registerRoute = require("./registerRoute");
const createRoomRoute = require("./createRoomRoute");
const roomsRoute = require("./roomsRoute");
const invitesRoute = require("./invitesRoute");
const getLeaderboards = require("./getLeaderboards");
const updateUser = require("./updateUser");

// Use routes
router.use("/login", loginRoute);
router.use("/register", registerRoute);
router.use("/invite", createRoomRoute);
router.use("/rooms", roomsRoute);
router.use("/invites", invitesRoute);
router.use("/leaderboard", getLeaderboards);
router.use("/update", updateUser);

module.exports = router;
