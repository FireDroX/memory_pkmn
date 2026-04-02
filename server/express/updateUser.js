const express = require("express");
const router = express.Router();

const db = require("../../db");
const { promisify } = require("util");
const levels = require("../utils/Levels");

// Promisify sqlite
const dbGet = promisify(db.get.bind(db));
const dbRun = promisify(db.run.bind(db));

router.post("/", async (req, res) => {
  try {
    const { name, xp, userProfile = undefined } = req.body;

    // Récupérer le joueur
    const playerRaw = await dbGet(`SELECT * FROM users WHERE name = ?`, [name]);

    if (!playerRaw) return res.json({ status: "Player does not exists." });

    // Parser user_profile JSON
    const player = {
      ...playerRaw,
      user_profile: JSON.parse(playerRaw.user_profile || "{}"),
    };

    const { level, xp: xpOld, xpNeeded } = player.user_profile;
    const updatedUser = userProfile || player.user_profile;

    // Check level up
    if (xpOld + xp >= xpNeeded && levels.length > level + 1) {
      const newInfos = levels[level + 1];
      updatedUser.level = newInfos.level;
      updatedUser.xp = xpOld + xp - xpNeeded;
      updatedUser.xpNeeded = newInfos.xpNeeded;

      if (newInfos.rewards.colors.length > 0) {
        newInfos.rewards.colors.forEach((color) => {
          if (!updatedUser.inventory[0].colors.includes(color)) {
            updatedUser.inventory[0].colors.push(color);
          }
        });
      }
    } else {
      updatedUser.xp = xpOld + xp;
    }

    // Update user in DB
    await dbRun(`UPDATE users SET user_profile = ? WHERE name = ?`, [
      JSON.stringify(updatedUser),
      name,
    ]);

    return res.json({
      status: "",
      profile: updatedUser,
    });
  } catch (error) {
    console.error(error);
    return res.json({ status: "Error updating user profile." });
  }
});

module.exports = router;
