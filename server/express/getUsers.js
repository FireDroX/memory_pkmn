const express = require("express");
const router = express.Router();

router.get("/", async (_, res) => {
  try {
    const pool = await require("../../db");

    const result = await pool.query(`SELECT name FROM users ORDER BY name`);

    const users = result.recordset;

    res.json({ users: users.map((u) => u.name) });
  } catch (error) {
    console.log(error);
    res.json({ error: "Failed to fetch users" });
  }
});

module.exports = router;
