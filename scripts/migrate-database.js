const { createHash } = require("node:crypto");
const { readdir, readFile } = require("node:fs/promises");
const path = require("node:path");
const mysql = require("mysql2/promise");

require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });

const migrationsDirectory = path.resolve(
  __dirname,
  "..",
  "database",
  "migrations",
);
const database = process.env.SQL_DBNAME || "pokeflip";
const port = Number(process.env.SQL_PORT || 3306);

if (!/^[a-zA-Z0-9_]+$/.test(database)) {
  throw new Error("SQL_DBNAME contient des caracteres non autorises.");
}

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("SQL_PORT doit etre un port valide.");
}

const connectionConfig = {
  host: process.env.SQL_SERVER || "localhost",
  port,
  user: process.env.SQL_USER || "root",
  password: process.env.SQL_PASSWORD || "",
  charset: "utf8mb4",
};

const getMigrations = async () => {
  const entries = await readdir(migrationsDirectory, { withFileTypes: true });
  const sqlFiles = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".sql"))
    .map((entry) => entry.name)
    .sort((first, second) => first.localeCompare(second, "en"));

  const invalidFile = sqlFiles.find(
    (filename) => !/^\d{3}_[a-z0-9_-]+\.sql$/i.test(filename),
  );

  if (invalidFile) {
    throw new Error(
      `Migration invalide "${invalidFile}". Format attendu : 001_description.sql.`,
    );
  }

  if (sqlFiles.length === 0) {
    throw new Error("Aucune migration SQL trouvee dans database/migrations.");
  }

  return Promise.all(
    sqlFiles.map(async (filename) => {
      const sql = await readFile(
        path.join(migrationsDirectory, filename),
        "utf8",
      );
      const checksum = createHash("sha256").update(sql).digest("hex");

      return { filename, sql, checksum };
    }),
  );
};

const ensureDatabase = async () => {
  const connection = await mysql.createConnection(connectionConfig);

  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
  } finally {
    await connection.end();
  }
};

const formatError = (error) => {
  if (error.message) return error.message;

  if (Array.isArray(error.errors)) {
    return error.errors
      .map((connectionError) => connectionError.message)
      .filter(Boolean)
      .join(" | ");
  }

  return String(error);
};

const migrate = async () => {
  const migrations = await getMigrations();
  await ensureDatabase();

  const connection = await mysql.createConnection({
    ...connectionConfig,
    database,
    multipleStatements: true,
  });
  const lockName = `pokeflip-migrations-${database}`.slice(0, 64);
  let lockAcquired = false;

  try {
    const [[lockResult]] = await connection.execute(
      "SELECT GET_LOCK(?, 10) AS acquired",
      [lockName],
    );
    lockAcquired = Number(lockResult.acquired) === 1;

    if (!lockAcquired) {
      throw new Error("Une autre execution des migrations est deja en cours.");
    }

    await connection.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename VARCHAR(255) NOT NULL,
        checksum CHAR(64) NOT NULL,
        applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (filename)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    const [rows] = await connection.query(
      "SELECT filename, checksum FROM schema_migrations ORDER BY filename",
    );
    const appliedMigrations = new Map(
      rows.map((row) => [row.filename, row.checksum]),
    );
    let appliedCount = 0;

    for (const migration of migrations) {
      const appliedChecksum = appliedMigrations.get(migration.filename);

      if (appliedChecksum) {
        if (appliedChecksum !== migration.checksum) {
          throw new Error(
            `La migration deja appliquee "${migration.filename}" a ete modifiee.`,
          );
        }

        console.log(`Deja appliquee : ${migration.filename}`);
        continue;
      }

      await connection.query(migration.sql);
      await connection.execute(
        "INSERT INTO schema_migrations (filename, checksum) VALUES (?, ?)",
        [migration.filename, migration.checksum],
      );
      appliedCount += 1;
      console.log(`Appliquee : ${migration.filename}`);
    }

    console.log(
      appliedCount === 0
        ? `Base "${database}" deja a jour.`
        : `Base "${database}" a jour (${appliedCount} migration(s) appliquee(s)).`,
    );
  } finally {
    if (lockAcquired) {
      await connection.execute("SELECT RELEASE_LOCK(?)", [lockName]);
    }
    await connection.end();
  }
};

migrate().catch((error) => {
  console.error(
    "Impossible d'appliquer les migrations MySQL :",
    formatError(error),
  );
  process.exitCode = 1;
});
