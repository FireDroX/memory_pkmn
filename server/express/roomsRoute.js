const express = require("express");

const router = express.Router();

const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

router.post("/get", async (req, res) => {
  const users = await supabase.from("users").select();
  const rooms = await supabase.from("rooms").select();
  const room = rooms.data.filter((room) => room.id === req.body.room)[0];
  if (!room) return res.sendStatus(204);
  const player1 = users.data.filter(
    (player) => player.id === room.player1.id
  )[0];
  const player2 = users.data.filter(
    (player) => player.id === room.player2.id
  )[0];
  res.json({
    users: [
      { name: player1.name, skin: player1.user_profile.inventory[0].colors[0] },
      { name: player2.name, skin: player2.user_profile.inventory[0].colors[0] },
    ],
    room: room,
  });
});

router.post("/delete", async (req, res) => {
  const rooms = await supabase.from("rooms").select();
  const room = rooms.data.filter((room) => room.id === req.body.room)[0];
  if (!room) return res.sendStatus(204);
  const player = room.player1.name === req.body.name;
  if (!player) return res.sendStatus(204);

  await supabase.from("rooms").delete().eq("id", req.body.room);

  return res.json({ status: `The room : ${req.body.room} has been deleted.` });
});

module.exports = router;
