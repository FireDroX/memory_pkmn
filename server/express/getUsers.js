const express = require("express");
const pool = require("../../db");

const router = express.Router();

router.get("/", async (_, res) => {
  try {
    const [users] = await pool.query("SELECT name FROM users ORDER BY name");
    return res.json({ users: users.map((user) => user.name) });
  } catch (error) {
    console.error("Users error:", error);
    return res.status(500).json({ error: "Impossible de charger les joueurs." });
  }
});

module.exports = router;
