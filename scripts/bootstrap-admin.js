const bootstrapAdmin = async (database, name) => {
  const canonicalName = String(name || "").trim();
  if (!/^[a-zA-Z0-9]{1,25}$/.test(canonicalName)) {
    throw new Error("Le pseudo administrateur est invalide.");
  }

  const connection = await database.getConnection();
  let transactionStarted = false;
  try {
    await connection.beginTransaction();
    transactionStarted = true;
    const [users] = await connection.execute(
      `SELECT id, name, role
       FROM users
       WHERE name = ?
       LIMIT 1
       FOR UPDATE`,
      [canonicalName],
    );
    const user = users[0];
    if (!user) {
      throw new Error(
        `Le compte ${canonicalName} n'existe pas. Cree-le puis relance cette commande.`,
      );
    }

    const [administrators] = await connection.execute(
      "SELECT id FROM users WHERE role = 'admin' FOR UPDATE",
    );
    if (user.role !== "admin" && administrators.length > 0) {
      throw new Error(
        "Un administrateur existe deja : utilise la page d'administration.",
      );
    }

    if (user.role !== "admin") {
      await connection.execute(
        "UPDATE users SET role = 'admin' WHERE id = ?",
        [user.id],
      );
    }
    await connection.commit();
    transactionStarted = false;
    return { id: user.id, name: user.name, role: "admin" };
  } catch (error) {
    if (transactionStarted) await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const run = async () => {
  require("dotenv").config();
  const pool = require("../db");
  try {
    const user = await bootstrapAdmin(pool, process.argv[2]);
    console.log(`Administrateur initialise : ${user.name}`);
  } finally {
    await pool.end();
  }
};

if (require.main === module) {
  run().catch((error) => {
    console.error("Initialisation administrateur impossible :", error.message);
    process.exitCode = 1;
  });
}

module.exports = { bootstrapAdmin };
