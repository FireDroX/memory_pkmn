const express = require("express");
const pool = require("../../db");
const parseJson = require("../utils/parseJson");
const { addXp } = require("../utils/profileProgress");
const {
  getDailyChallenges,
  getParisDateKey,
} = require("../utils/dailyChallenges");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const [users] = await pool.execute(
      "SELECT id FROM users WHERE id = ? LIMIT 1",
      [req.auth.id],
    );
    if (!users[0]) {
      return res.status(404).json({ status: "Joueur introuvable." });
    }

    const date = getParisDateKey();
    const [progressRows] = await pool.execute(
      `SELECT challenge_id, progress, completed_at, claimed_at
       FROM daily_challenge_progress
       WHERE user_id = ? AND challenge_date = ?`,
      [users[0].id, date],
    );
    const challenges = getDailyChallenges(date).map((challenge) => {
      const progress = progressRows.find(
        (entry) => entry.challenge_id === challenge.id,
      );
      return {
        ...challenge,
        progress: Math.min(Number(progress?.progress) || 0, challenge.target),
        completed: Boolean(progress?.completed_at),
        claimed: Boolean(progress?.claimed_at),
      };
    });

    return res.json({ date, challenges });
  } catch (error) {
    console.error("Daily challenges fetch error:", error);
    return res.status(500).json({ status: "Chargement des defis impossible." });
  }
});

router.post("/claim", async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const challengeId = String(req.body.challengeId || "");
    const date = getParisDateKey();
    const challenge = getDailyChallenges(date).find(
      (entry) => entry.id === challengeId,
    );
    if (!challenge) {
      await connection.rollback();
      return res.status(400).json({ status: "Defi invalide." });
    }

    const [users] = await connection.execute(
      "SELECT id, user_profile FROM users WHERE id = ? LIMIT 1 FOR UPDATE",
      [req.auth.id],
    );
    const user = users[0];
    if (!user) {
      await connection.rollback();
      return res.status(404).json({ status: "Joueur introuvable." });
    }

    const [progressRows] = await connection.execute(
      `SELECT progress, completed_at, claimed_at
       FROM daily_challenge_progress
       WHERE user_id = ? AND challenge_date = ? AND challenge_id = ?
       LIMIT 1 FOR UPDATE`,
      [user.id, date, challenge.id],
    );
    const progress = progressRows[0];
    if (!progress?.completed_at || Number(progress.progress) < challenge.target) {
      await connection.rollback();
      return res.status(409).json({ status: "Ce defi n'est pas encore termine." });
    }
    if (progress.claimed_at) {
      await connection.rollback();
      return res.status(409).json({ status: "Recompense deja recuperee." });
    }

    const profile = addXp(
      parseJson(user.user_profile, {}),
      challenge.rewardXp,
    );
    await connection.execute(
      `UPDATE daily_challenge_progress SET claimed_at = CURRENT_TIMESTAMP
       WHERE user_id = ? AND challenge_date = ? AND challenge_id = ?`,
      [user.id, date, challenge.id],
    );
    await connection.execute(
      "UPDATE users SET user_profile = ? WHERE id = ?",
      [JSON.stringify(profile), user.id],
    );
    await connection.commit();
    return res.json({
      status: `Recompense recuperee : +${challenge.rewardXp} XP.`,
      profile,
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Daily challenge claim error:", error);
    return res.status(500).json({ status: "Recompense impossible a recuperer." });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;
