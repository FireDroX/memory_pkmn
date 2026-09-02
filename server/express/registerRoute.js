const express = require("express");
const bcrypt = require("bcryptjs");
const { randomUUID } = require("node:crypto");
const zxcvbn = require("zxcvbn");
const pool = require("../../db");
const {
  isValidUsername,
  isReservedUsername,
  normalizeUsername,
} = require("../utils/username");
const { createRateLimiter } = require("../utils/rateLimit");
const { createTurnstileMiddleware } = require("../utils/turnstile");
const composeMiddleware = require("../utils/composeMiddleware");

const genericRegisterError = {
  status: "Inscription impossible. Verifie ton pseudo et ton mot de passe.",
};

const isStrongEnoughPassword = (password, name) =>
  password.length >= 8 &&
  zxcvbn(password, [name]).score >= 2;

const registerLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 5,
  message: genericRegisterError.status,
});
const verifyTurnstile = createTurnstileMiddleware();

const router = express.Router();

router.post(
  "/",
  composeMiddleware(registerLimiter, verifyTurnstile, async (req, res) => {
    try {
      const name = normalizeUsername(req.body.name);
      const password = String(req.body.password || "");

      if (
        !isValidUsername(name) ||
        isReservedUsername(name) ||
        !isStrongEnoughPassword(password, name)
      ) {
        return res.status(400).json(genericRegisterError);
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const userProfile = {
        level: 0,
        xp: 0,
        xpNeeded: 10,
        inventory: [{ colors: ["color-default"] }],
        achievements: [0],
      };

      try {
        await pool.execute(
          `INSERT INTO users
            (id, name, password, online_games_won, shiny_pairs_found, user_profile)
           VALUES (?, ?, ?, 0, 0, ?)`,
          [
            `USER-${randomUUID()}`,
            name,
            hashedPassword,
            JSON.stringify(userProfile),
          ],
        );
      } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
          return res.status(400).json(genericRegisterError);
        }
        throw error;
      }

      return res
        .status(201)
        .json({ status: "Compte cree. Tu peux maintenant te connecter." });
    } catch (error) {
      console.error("Registration error:", error);
      return res.status(500).json({ status: "Creation du compte impossible." });
    }
  }),
);

module.exports = router;
