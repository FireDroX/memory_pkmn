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

  // User verification, if does not exist or password is incorrect
  const user = users.data.find((user) => user.name === name);
  if (!user || !(await bcrypt.compare(password, user.password)))
    return res.json({ status: "Incorrect Username or Password !" });

  return res.json({
    status: "",
    online_games_won: user.online_games_won,
    created_at: user.created_at,
    profile: user.user_profile,
  });
});

module.exports = router;
