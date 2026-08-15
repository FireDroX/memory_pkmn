const express = require("express");
const requireAuthentication = require("./requireAuthentication");
const router = express.Router();

// Public routes
router.use("/login", require("./loginRoute"));
router.use("/register", require("./registerRoute"));
router.use("/profile/leaderboard", require("./getLeaderboards"));
router.use("/mentions-legales", require("./mentionsLegales"));

// Authenticated routes
router.use(requireAuthentication);
router.use("/invite", require("./createRoomRoute"));
router.use("/rooms", require("./roomsRoute"));
router.use("/invites", require("./invitesRoute"));
router.use("/profile/summary", require("./getProfile"));
router.use("/profile/update", require("./updateUser"));
router.use("/profile/users", require("./getUsers"));
router.use("/friends", require("./friendsRoute"));
router.use("/daily-challenges", require("./dailyChallengesRoute"));

module.exports = router;
