const rateLimit = require("express-rate-limit");

const createRateLimiter = ({
  windowMs = 60 * 1000,
  max = 5,
  message = "Trop de tentatives, reessaie plus tard.",
} = {}) =>
  rateLimit({
    windowMs,
    limit: max,
    standardHeaders: true,
    legacyHeaders: false,
    validate: false,
    keyGenerator: (req) => req.ip || req.socket?.remoteAddress || "unknown",
    handler: (_req, res) => res.status(429).json({ status: message }),
  });

module.exports = { createRateLimiter };
