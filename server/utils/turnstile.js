const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

const createTurnstileMiddleware = ({
  secretKey = process.env.TURNSTILE_SECRET_KEY,
  fetchImpl = fetch,
} = {}) => async (req, res, next) => {
  if (!secretKey) return next();

  const token = req.body?.turnstileToken;
  if (!token) {
    return res
      .status(400)
      .json({ status: "Verification anti-robot requise." });
  }

  try {
    const verification = await fetchImpl(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: secretKey,
        response: token,
        remoteip: req.ip,
      }),
    });
    const result = await verification.json();

    if (!result.success) {
      return res
        .status(400)
        .json({ status: "Verification anti-robot invalide." });
    }
    return next();
  } catch (error) {
    console.error("Turnstile verification error:", error);
    return res
      .status(503)
      .json({ status: "Verification anti-robot indisponible." });
  }
};

module.exports = { createTurnstileMiddleware };
