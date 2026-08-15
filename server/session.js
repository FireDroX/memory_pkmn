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

const assertSessionStoreReady = async (connection = pool) => {
  await connection.execute("SELECT 1");
  const [tables] = await connection.execute(
    `SELECT COUNT(*) AS total
     FROM information_schema.tables
     WHERE table_schema = DATABASE() AND table_name = ?`,
    ["sessions"],
  );
  if (Number(tables[0]?.total) !== 1) {
    throw new Error(
      "La table sessions est absente. Execute npm run db:migrate.",
    );
  }
};

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
      secure: production ? "auto" : false,
      maxAge: sessionLifetime,
    },
  });

module.exports = {
  assertSessionStoreReady,
  createSessionMiddleware,
  createSessionStore,
  getSessionSecret,
  sessionCookieName,
  sessionLifetime,
};
