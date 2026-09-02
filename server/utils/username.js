const normalizeUsername = (value) => String(value || "").trim();

const isValidUsername = (name) => /^[a-zA-Z0-9]{1,25}$/.test(name);

const reservedUsernames = new Set([
  "admin",
  "administrator",
  "moderator",
  "mod",
  "root",
  "staff",
  "support",
  "system",
  "superuser",
  "owner",
  "official",
  "pokeflip",
  "help",
  "bot",
  "null",
  "undefined",
]);

const isReservedUsername = (name) =>
  reservedUsernames.has(String(name || "").toLowerCase());

module.exports = { isValidUsername, isReservedUsername, normalizeUsername };
