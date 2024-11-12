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
    )[0];
    const player2 = users.data.filter(
      (player) => player.id === room.player2.id
    )[0];

    returnedRooms.push({
      id: room.id,
      player1: {
        name: player1.name,
        skin: player1.user_profile.inventory[0].colors[0],
      },
      player2: {
        name: player2.name,
        skin: player2.user_profile.inventory[0].colors[0],
      },
      created_at: room.created_at,
    });
  }
  res.json(returnedRooms);
});

module.exports = router;
