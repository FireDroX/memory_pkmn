const normalizeUsername = (value) => String(value || "").trim();

const isValidUsername = (name) => /^[a-zA-Z0-9]{1,25}$/.test(name);

module.exports = { isValidUsername, normalizeUsername };
