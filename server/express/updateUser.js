const express = require("express");
const router = express.Router();

const levels = require("../utils/Levels");

router.post("/", async (req, res) => {
  try {
    const pool = await require("../../db");

    const { name, xp, userProfile = undefined } = req.body;

    // Récupérer le joueur
    const selectRequest = `
      SELECT * FROM users WHERE name = @name
    `;

    const result = await pool
      .request()
      .input("name", name)
      .query(selectRequest);

    const playerRaw = result.recordset[0];

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
    const updateRequest = `
      UPDATE users
      SET user_profile = @user_profile
      WHERE name = @name
    `;

    await pool
      .request()
      .input("user_profile", JSON.stringify(updatedUser))
      .input("name", name)
      .query(updateRequest);

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
