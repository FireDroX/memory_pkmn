const express = require("express");
const pool = require("../../db");

const router = express.Router();

const getUser = async (name) => {
  const [users] = await pool.execute(
    "SELECT id, name FROM users WHERE name = ? LIMIT 1",
    [String(name || "").trim()],
  );
  return users[0];
};

const orderedIds = (firstId, secondId) =>
  firstId.localeCompare(secondId) < 0
    ? [firstId, secondId]
    : [secondId, firstId];

router.get("/", async (req, res) => {
  try {
    const user = await getUser(req.query.name);
    if (!user) {
      return res.status(404).json({ status: "Joueur introuvable." });
    }

    const [relationships] = await pool.execute(
      `SELECT f.status, f.requested_by,
              CASE WHEN f.user_id = ? THEN friend.name ELSE owner.name END AS name
       FROM friendships f
       JOIN users owner ON owner.id = f.user_id
       JOIN users friend ON friend.id = f.friend_id
       WHERE f.user_id = ? OR f.friend_id = ?
       ORDER BY name`,
      [user.id, user.id, user.id],
    );

    return res.json({
      friends: relationships
        .filter((entry) => entry.status === "accepted")
        .map((entry) => entry.name),
      incoming: relationships
        .filter(
          (entry) =>
            entry.status === "pending" && entry.requested_by !== user.id,
        )
        .map((entry) => entry.name),
      outgoing: relationships
        .filter(
          (entry) =>
            entry.status === "pending" && entry.requested_by === user.id,
        )
        .map((entry) => entry.name),
    });
  } catch (error) {
    console.error("Friends fetch error:", error);
    return res.status(500).json({ status: "Chargement des amis impossible." });
  }
});

router.post("/request", async (req, res) => {
  try {
    const requester = await getUser(req.body.name);
    const target = await getUser(req.body.friendName);

    if (!requester || !target) {
      return res.status(404).json({ status: "Joueur introuvable." });
    }
    if (requester.id === target.id) {
      return res.status(400).json({ status: "Tu ne peux pas t'ajouter toi-meme." });
    }

    const [userId, friendId] = orderedIds(requester.id, target.id);
    const [existing] = await pool.execute(
      `SELECT status, requested_by FROM friendships
       WHERE user_id = ? AND friend_id = ? LIMIT 1`,
      [userId, friendId],
    );

    if (existing[0]?.status === "accepted") {
      return res.status(409).json({ status: "Ce joueur est deja ton ami." });
    }
    if (existing[0]?.requested_by === requester.id) {
      return res.status(409).json({ status: "Demande deja envoyee." });
    }
    if (existing[0]) {
      await pool.execute(
        `UPDATE friendships SET status = 'accepted'
         WHERE user_id = ? AND friend_id = ?`,
        [userId, friendId],
      );
      return res.json({ status: `${target.name} fait maintenant partie de tes amis.` });
    }

    await pool.execute(
      `INSERT INTO friendships (user_id, friend_id, requested_by)
       VALUES (?, ?, ?)`,
      [userId, friendId, requester.id],
    );
    return res.status(201).json({ status: `Demande envoyee a ${target.name}.` });
  } catch (error) {
    console.error("Friend request error:", error);
    return res.status(500).json({ status: "Envoi de la demande impossible." });
  }
});

router.post("/accept", async (req, res) => {
  try {
    const user = await getUser(req.body.name);
    const requester = await getUser(req.body.friendName);
    if (!user || !requester) {
      return res.status(404).json({ status: "Joueur introuvable." });
    }

    const [userId, friendId] = orderedIds(user.id, requester.id);
    const [result] = await pool.execute(
      `UPDATE friendships SET status = 'accepted'
       WHERE user_id = ? AND friend_id = ?
         AND status = 'pending' AND requested_by = ?`,
      [userId, friendId, requester.id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ status: "Demande d'ami introuvable." });
    }
    return res.json({ status: `${requester.name} fait maintenant partie de tes amis.` });
  } catch (error) {
    console.error("Friend accept error:", error);
    return res.status(500).json({ status: "Acceptation impossible." });
  }
});

router.delete("/", async (req, res) => {
  try {
    const user = await getUser(req.body.name);
    const friend = await getUser(req.body.friendName);
    if (!user || !friend) {
      return res.status(404).json({ status: "Joueur introuvable." });
    }

    const [userId, friendId] = orderedIds(user.id, friend.id);
    const [result] = await pool.execute(
      "DELETE FROM friendships WHERE user_id = ? AND friend_id = ?",
      [userId, friendId],
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ status: "Relation introuvable." });
    }
    return res.json({ status: "Relation supprimee." });
  } catch (error) {
    console.error("Friend deletion error:", error);
    return res.status(500).json({ status: "Suppression impossible." });
  }
});

module.exports = router;
