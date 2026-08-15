const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
const pool = require("../db");

const sessionCookieName = "pokeflip.sid";
const sessionLifetime = 24 * 60 * 60 * 1000;

const getSessionSecret = (environment = process.env) => {
  const secret = String(environment.SESSION_SECRET || "");
  if (secret.length < 32) {
    throw new Error("SESSION_SECRET doit contenir au moins 32 caracteres.");
  }
  return secret;
};

const createSessionStore = (connection = pool) =>
  new MySQLStore(
    {
      clearExpired: true,
      checkExpirationInterval: 15 * 60 * 1000,
      expiration: sessionLifetime,
      createDatabaseTable: false,
      endConnectionOnClose: false,
      charset: "utf8mb4_bin",
      schema: {
        tableName: "sessions",
        columnNames: {
          session_id: "session_id",
          expires: "expires",
          data: "data",
        },
      },
    },
    connection,
  );

const createSessionMiddleware = ({
  store,
  secret = getSessionSecret(),
  production = process.env.NODE_ENV === "production",
} = {}) =>
  session({
    name: sessionCookieName,
    secret,
    store,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: production,
      maxAge: sessionLifetime,
    },
  });

module.exports = {
  createSessionMiddleware,
  createSessionStore,
  getSessionSecret,
  sessionCookieName,
  sessionLifetime,
};
