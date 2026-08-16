const express = require("express");
const pool = require("../../db");
const parseJson = require("../utils/parseJson");
const {
  addXp,
  prepareProfile,
  unlockAchievement,
  isWeekendInParis,
} = require("../utils/profileProgress");
const { recordDailyProgress } = require("../utils/dailyChallenges");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const earnedXp = Math.max(0, Number(req.body.xp) || 0);
    const gameResult = req.body.gameResult;

    const [players] = await pool.execute(
      "SELECT id, user_profile FROM users WHERE id = ? LIMIT 1",
      [req.auth.id],
    );
    if (!players[0]) {
      return res.status(404).json({ status: "Joueur introuvable." });
    }

    const currentProfile = prepareProfile(
      parseJson(players[0].user_profile, {}),
    );
    let updatedUser = addXp(currentProfile, earnedXp);
    if (req.body.userProfile) {
      const requestedColors =
        req.body.userProfile?.inventory?.[0]?.colors || [];
      const currentColors = currentProfile.inventory[0].colors;
      const containsSameColors =
        requestedColors.length === currentColors.length &&
        new Set(requestedColors).size === new Set(currentColors).size &&
        requestedColors.every((color) => currentColors.includes(color));

      if (!containsSameColors) {
        return res.status(400).json({
          status: "Selection de couleur invalide.",
        });
      }
      const newlyUnlockedColors = updatedUser.inventory[0].colors.filter(
        (color) => !currentColors.includes(color),
      );
      updatedUser.inventory[0].colors = [
        ...requestedColors,
        ...newlyUnlockedColors,
      ];
    }
    if (earnedXp > 0 && isWeekendInParis()) {
      updatedUser = unlockAchievement(updatedUser, 10);
    }
    if (updatedUser.level >= 5) {
      updatedUser = unlockAchievement(updatedUser, 150);
    }

    await pool.execute(
      "UPDATE users SET user_profile = ? WHERE id = ?",
      [JSON.stringify(updatedUser), req.auth.id],
    );

    if (gameResult && typeof gameResult.won === "boolean") {
      const pairsFound = Math.max(0, Number(gameResult.pairsFound) || 0);
      const remainingTries = Math.max(
        0,
        Number(gameResult.remainingTries) || 0,
      );
      await pool.execute(
        `UPDATE users
         SET solo_games_played = solo_games_played + 1,
             solo_games_won = solo_games_won + ?,
             total_pairs_found = total_pairs_found + ?,
             solo_best_remaining_tries = CASE
               WHEN ? = 1 THEN GREATEST(solo_best_remaining_tries, ?)
               ELSE solo_best_remaining_tries
             END
         WHERE id = ?`,
        [
          gameResult.won ? 1 : 0,
          pairsFound,
          gameResult.won ? 1 : 0,
          remainingTries,
          req.auth.id,
        ],
      );
      await recordDailyProgress(pool, players[0].id, {
        pairsFound,
        soloGames: 1,
        soloWins: gameResult.won ? 1 : 0,
      });
    }

    return res.json({ status: "", profile: updatedUser });
  } catch (error) {
    console.error("Profile update error:", error);
    return res.status(500).json({ status: "Mise a jour du profil impossible." });
  }
});

module.exports = router;
