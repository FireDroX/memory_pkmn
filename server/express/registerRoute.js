const express = require("express");
const bcrypt = require("bcrypt");

const router = express.Router();

const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

router.post("/", async (req, res) => {
  const users = await supabase.from("users").select();
  const { name, password } = req.body;
  // If the values are empty
  if (name === "" && password === "")
    return res.json({ status: "Both inputs are required." });

  // If the username is already used
  if (users.data.some((user) => user.name === name))
    return res.json({ status: "That username is already used." });

  const hashedPassword = await bcrypt.hash(password, 10);

  const { error } = await supabase.from("users").insert({
    id: "USER-" + Date.now().toString(),
    name: name,
    password: hashedPassword,
    online_games_won: 0,
    shiny_pairs_found: 0,
  });

  return res.json({
    status: `${error ? error : "Accout created, please Login."}`,
  });
});

module.exports = router;
