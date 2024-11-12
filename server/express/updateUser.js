const express = require("express");

const router = express.Router();

const levels = require("../utils/Levels");

const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

router.post("/", async (req, res) => {
  const { name, xp } = req.body;
  const { data: player } = await supabase
    .from("users")
    .select("*")
    .eq("name", name)
    .single();

  if (!player) return res.json({ status: "Player does not exists." });

  const { level, xp: xpOld, xpNeeded } = player.user_profile;
  const updatedUser = player.user_profile;

  if (xpOld + xp >= xpNeeded) {
    if (levels.length <= level + 1) return;
    const newInfos = levels[level + 1];
    updatedUser.level = newInfos.level;
    updatedUser.xp = xpOld + xp - xpNeeded;
    updatedUser.xpNeeded = newInfos.xpNeeded;
    if (
      newInfos.rewards?.color &&
      !updatedUser.inventory[0].colors.unshift(newInfos.rewards.color)
    ) {
      updatedUser.inventory[0].colors.push(newInfos.rewards.color);
    }
  } else {
    updatedUser.xp = xpOld + xp;
  }

  const { error: updateUserError } = await supabase
    .from("users")
    .update({
      user_profile: updatedUser,
    })
    .eq("name", name);

  if (updateUserError) console.log(updateUserError);

  return res.json({
    status: "",
    profile: player.user_profile,
  });
});

module.exports = router;
