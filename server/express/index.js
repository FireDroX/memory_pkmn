const express = require("express");
const router = express.Router();

// Use routes
router.use("/login", require("./loginRoute"));
router.use("/register", require("./registerRoute"));
router.use("/invite", require("./createRoomRoute"));
router.use("/rooms", require("./roomsRoute"));
router.use("/invites", require("./invitesRoute"));
router.use("/leaderboard", require("./getLeaderboards"));
router.use("/update", require("./updateUser"));

router.use("/mentions-legales", require("./mentionsLegales"));

module.exports = router;
