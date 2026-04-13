const express = require("express");
const bcrypt = require("bcrypt");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const pool = await require("../../db");

    const { name, password } = req.body;

    // Vérif inputs
    if (name === "" && password === "") {
      return res.json({ status: "Both inputs are required." });
    }

    // Récupérer utilisateur
    const request = `
      SELECT * FROM users WHERE name = @name
    `;

    const result = await pool.request().input("name", name).query(request);

    const userRaw = result.recordset[0];

    if (!userRaw) {
      return res.json({ status: "Incorrect Username or Password !" });
    }

    // Vérifier password
    const isValid = await bcrypt.compare(password, userRaw.password);
    if (!isValid) {
      return res.json({ status: "Incorrect Username or Password !" });
    }

    // Parse JSON profile
    const user = {
      ...userRaw,
      user_profile: JSON.parse(userRaw.user_profile || "{}"),
    };

    return res.json({
      status: "",
      online_games_won: user.online_games_won,
      created_at: user.created_at,
      profile: user.user_profile,
    });
  } catch (error) {
    console.error(error);
    return res.json({ status: "Login error" });
  }
});

module.exports = router;
