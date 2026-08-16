const express = require("express");
const bcrypt = require("bcryptjs");
const pool = require("../../db");
const parseJson = require("../utils/parseJson");
const { unlockStatAchievements } = require("../utils/profileProgress");
const { formatPlayerStats } = require("../utils/playerStats");
const { sessionCookieName } = require("../session");

const router = express.Router();

const buildAuthenticatedUser = (user) => {
  const profile = unlockStatAchievements(
    parseJson(user.user_profile, {}),
    {
      wins: user.online_games_won,
      shiny: user.shiny_pairs_found,
    },
  );

  return {
    status: "",
    name: user.name,
    role: user.role === "admin" ? "admin" : "user",
    stats: formatPlayerStats(user),
    profile,
  };
};

const regenerateSession = (request) =>
  new Promise((resolve, reject) => {
    request.session.regenerate((error) =>
      error ? reject(error) : resolve(),
    );
  });

const saveSession = (request) =>
  new Promise((resolve, reject) => {
    request.session.save((error) => (error ? reject(error) : resolve()));
  });

router.post("/", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const password = String(req.body.password || "");

    if (!name || !password) {
      return res.status(400).json({ status: "Tous les champs sont requis." });
    }

    const [users] = await pool.execute(
      "SELECT * FROM users WHERE name = ? LIMIT 1",
      [name],
    );
    const user = users[0];

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res
        .status(401)
        .json({ status: "Identifiant ou mot de passe incorrect." });
    }
    if (!user.is_active) {
      return res.status(403).json({ status: "Compte desactive." });
    }

    await regenerateSession(req);
    req.session.user = { id: user.id, name: user.name };
    await saveSession(req);

    return res.json(buildAuthenticatedUser(user));
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ status: "Connexion impossible." });
  }
});

router.get("/session", async (req, res) => {
  try {
    const userId = req.session?.user?.id;
    if (!userId) {
      return res.status(401).json({ authenticated: false });
    }

    const [users] = await pool.execute(
      "SELECT * FROM users WHERE id = ? LIMIT 1",
      [userId],
    );
    const user = users[0];
    if (!user || !user.is_active) {
      return req.session.destroy(() => {
        res.clearCookie(sessionCookieName, { path: "/" });
        return res.status(401).json({ authenticated: false });
      });
    }

    req.session.user.name = user.name;
    return res.json(buildAuthenticatedUser(user));
  } catch (error) {
    console.error("Session restore error:", error);
    return res.status(500).json({ authenticated: false });
  }
});

router.delete("/session", (req, res) => {
  if (!req.session) return res.sendStatus(204);

  const sessionId = req.session.id;
  req.session.destroy((error) => {
    if (error) {
      console.error("Session logout error:", error);
      return res.status(500).json({ status: "Deconnexion impossible." });
    }
    req.app?.get?.("io")?.in(sessionId).disconnectSockets();
    res.clearCookie(sessionCookieName, { path: "/" });
    return res.sendStatus(204);
  });
});

module.exports = router;
