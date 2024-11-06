const express = require("express");

const router = express.Router();

const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

router.get("/", async (_, res) => {
  const users = await supabase.from("users").select();
  const rooms = await supabase.from("rooms").select();
  const returnedRooms = [];
  for (const room of rooms.data) {
    const player1 = users.data.filter(
      (player) => player.id === room.player1.id
    )[0].name;
    const player2 = users.data.filter(
      (player) => player.id === room.player2.id
    )[0].name;

    returnedRooms.push({
      id: room.id,
      player1,
      player2,
      created_at: room.created_at,
      isShiny: room.isShiny,
    });
  }
  res.json(returnedRooms);
});

module.exports = router;
