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

  const players = room.players.map((player) => {
    const newPlayer = users.data.filter((p) => p.id === player.id)[0];
    return {
      name: newPlayer.name,
      skin: newPlayer.user_profile.inventory[0].colors[0],
    };
  });

  res.json({
    users: players,
    room: room,
  });
});

router.post("/delete", async (req, res) => {
  const rooms = await supabase.from("rooms").select();
  const room = rooms.data.filter((room) => room.id === req.body.room)[0];
  if (!room) return res.sendStatus(204);
  const player = room.players[0].name === req.body.name;
  if (!player) return res.sendStatus(204);

  await supabase.from("rooms").delete().eq("id", req.body.room);

  return res.json({ status: `The room : ${req.body.room} has been deleted.` });
});

module.exports = router;
