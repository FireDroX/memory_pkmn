const express = require("express");
const pool = require("../../db");
const parseJson = require("../utils/parseJson");
const { formatPlayerStats } = require("../utils/playerStats");

const allowedRoles = new Set(["user", "admin"]);

const deleteOpenRoomsForUser = async (connection, userId) => {
  const [rooms] = await connection.execute(
    `SELECT id, players FROM rooms
     WHERE completed_at IS NULL
     FOR UPDATE`,
  );
  const roomIds = rooms
    .filter((room) =>
      parseJson(room.players, []).some((player) => player.id === userId),
    )
    .map((room) => room.id);

  if (roomIds.length === 0) return;
  const placeholders = roomIds.map(() => "?").join(", ");
  await connection.execute(
    `DELETE FROM rooms WHERE id IN (${placeholders})`,
    roomIds,
  );
};

const formatAdminUser = (user) => ({
  id: user.id,
  name: user.name,
  role: user.role === "admin" ? "admin" : "user",
  isActive: Boolean(user.is_active),
  level: Number(parseJson(user.user_profile, {}).level) || 0,
  ...formatPlayerStats(user),
});

const buildGlobalStats = (users) =>
  users.reduce(
    (stats, user) => ({
      totalUsers: stats.totalUsers + 1,
      totalAdmins: stats.totalAdmins + (user.role === "admin" ? 1 : 0),
      onlineGamesPlayed:
        stats.onlineGamesPlayed + (Number(user.online_games_played) || 0),
      onlineGamesWon:
        stats.onlineGamesWon + (Number(user.online_games_won) || 0),
      soloGamesPlayed:
        stats.soloGamesPlayed + (Number(user.solo_games_played) || 0),
      soloGamesWon: stats.soloGamesWon + (Number(user.solo_games_won) || 0),
      totalPairsFound:
        stats.totalPairsFound + (Number(user.total_pairs_found) || 0),
      shinyPairsFound:
        stats.shinyPairsFound + (Number(user.shiny_pairs_found) || 0),
    }),
    {
      totalUsers: 0,
      totalAdmins: 0,
      onlineGamesPlayed: 0,
      onlineGamesWon: 0,
      soloGamesPlayed: 0,
      soloGamesWon: 0,
      totalPairsFound: 0,
      shinyPairsFound: 0,
    },
  );

const createRequireAdmin = (database) => async (req, res, next) => {
  try {
    const [users] = await database.execute(
      "SELECT role, is_active FROM users WHERE id = ? LIMIT 1",
      [req.auth.id],
    );
    if (users[0]?.role !== "admin" || !users[0]?.is_active) {
      return res.status(403).json({ status: "Acces administrateur requis." });
    }
    return next();
  } catch (error) {
    console.error("Admin authorization error:", error);
    return res.status(500).json({ status: "Verification du role impossible." });
  }
};

const createAdminRouter = (database = pool) => {
  const router = express.Router();
  router.use(createRequireAdmin(database));

  router.get("/", async (_req, res) => {
    try {
      const [users] = await database.execute(
        `SELECT id, name, role, is_active, online_games_won, online_games_played,
                online_games_lost, current_win_streak, best_win_streak,
                shiny_pairs_found, total_pairs_found, solo_games_played,
                solo_games_won, solo_best_remaining_tries, created_at,
                user_profile
         FROM users
         ORDER BY created_at DESC, name ASC`,
      );

      return res.json({
        status: "",
        stats: buildGlobalStats(users),
        users: users.map(formatAdminUser),
      });
    } catch (error) {
      console.error("Admin dashboard error:", error);
      return res
        .status(500)
        .json({ status: "Chargement de l'administration impossible." });
    }
  });

  router.patch("/users/:id/status", async (req, res) => {
    if (typeof req.body.isActive !== "boolean") {
      return res.status(400).json({ status: "Statut utilisateur invalide." });
    }

    let connection;
    let transactionStarted = false;
    try {
      connection = await database.getConnection();
      await connection.beginTransaction();
      transactionStarted = true;
      const [users] = await connection.execute(
        `SELECT id, name, role, is_active
         FROM users
         WHERE id IN (?, ?)
         FOR UPDATE`,
        [req.auth.id, req.params.id],
      );
      const administrator = users.find((user) => user.id === req.auth.id);
      const target = users.find((user) => user.id === req.params.id);

      if (administrator?.role !== "admin" || !administrator.is_active) {
        await connection.rollback();
        transactionStarted = false;
        return res.status(403).json({ status: "Acces administrateur requis." });
      }
      if (!target) {
        await connection.rollback();
        transactionStarted = false;
        return res.status(404).json({ status: "Joueur introuvable." });
      }
      if (target.id === administrator.id && !req.body.isActive) {
        await connection.rollback();
        transactionStarted = false;
        return res
          .status(409)
          .json({ status: "Tu ne peux pas desactiver ton propre compte." });
      }

      const isActive = Boolean(target.is_active);
      if (isActive === req.body.isActive) {
        await connection.commit();
        transactionStarted = false;
        return res.json({
          status: "",
          user: { id: target.id, name: target.name, isActive },
        });
      }

      await connection.execute(
        "UPDATE users SET is_active = ? WHERE id = ?",
        [req.body.isActive, target.id],
      );
      if (!req.body.isActive) {
        await deleteOpenRoomsForUser(connection, target.id);
        await connection.execute(
          `DELETE FROM sessions
           WHERE JSON_VALID(data)
             AND JSON_UNQUOTE(JSON_EXTRACT(data, '$.user.id')) = ?`,
          [target.id],
        );
      }
      await connection.commit();
      transactionStarted = false;
      return res.json({
        status: req.body.isActive
          ? "Compte reactive."
          : "Compte desactive.",
        user: {
          id: target.id,
          name: target.name,
          isActive: req.body.isActive,
        },
      });
    } catch (error) {
      if (transactionStarted) await connection.rollback();
      console.error("Admin user status update error:", error);
      return res
        .status(500)
        .json({ status: "Mise a jour du statut impossible." });
    } finally {
      connection?.release();
    }
  });

  router.patch("/users/:id/role", async (req, res) => {
    const requestedRole = String(req.body.role || "");
    if (!allowedRoles.has(requestedRole)) {
      return res.status(400).json({ status: "Role utilisateur invalide." });
    }

    let connection;
    let transactionStarted = false;
    try {
      connection = await database.getConnection();
      await connection.beginTransaction();
      transactionStarted = true;
      const [users] = await connection.execute(
        `SELECT id, name, role, is_active
         FROM users
         WHERE id IN (?, ?)
         FOR UPDATE`,
        [req.auth.id, req.params.id],
      );
      const administrator = users.find((user) => user.id === req.auth.id);
      const target = users.find((user) => user.id === req.params.id);

      if (administrator?.role !== "admin" || !administrator.is_active) {
        await connection.rollback();
        transactionStarted = false;
        return res.status(403).json({ status: "Acces administrateur requis." });
      }
      if (!target) {
        await connection.rollback();
        transactionStarted = false;
        return res.status(404).json({ status: "Joueur introuvable." });
      }
      if (target.role === requestedRole) {
        await connection.commit();
        transactionStarted = false;
        return res.json({
          status: "",
          user: { id: target.id, name: target.name, role: target.role },
        });
      }

      if (target.role === "admin" && requestedRole === "user") {
        const [administrators] = await connection.execute(
          "SELECT id FROM users WHERE role = 'admin' FOR UPDATE",
        );
        if (administrators.length <= 1) {
          await connection.rollback();
          transactionStarted = false;
          return res
            .status(409)
            .json({ status: "Le dernier administrateur doit conserver son role." });
        }
      }

      await connection.execute("UPDATE users SET role = ? WHERE id = ?", [
        requestedRole,
        target.id,
      ]);
      await connection.commit();
      transactionStarted = false;
      return res.json({
        status: "Role mis a jour.",
        user: { id: target.id, name: target.name, role: requestedRole },
      });
    } catch (error) {
      if (transactionStarted) await connection.rollback();
      console.error("Admin role update error:", error);
      return res.status(500).json({ status: "Mise a jour du role impossible." });
    } finally {
      connection?.release();
    }
  });

  return router;
};

module.exports = createAdminRouter();
module.exports.createAdminRouter = createAdminRouter;
module.exports.buildGlobalStats = buildGlobalStats;
module.exports.formatAdminUser = formatAdminUser;
