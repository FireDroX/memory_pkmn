const express = require("express");
const router = express.Router();

// Use routes
router.use("/login", require("./loginRoute"));
router.use("/register", require("./registerRoute"));
router.use("/invite", require("./createRoomRoute"));
router.use("/rooms", require("./roomsRoute"));
router.use("/invites", require("./invitesRoute"));
router.use("/profile/leaderboard", require("./getLeaderboards"));
router.use("/profile/summary", require("./getProfile"));
router.use("/profile/update", require("./updateUser"));
router.use("/profile/users", require("./getUsers"));
router.use("/friends", require("./friendsRoute"));
router.use("/daily-challenges", require("./dailyChallengesRoute"));

router.use("/mentions-legales", require("./mentionsLegales"));

module.exports = router;
