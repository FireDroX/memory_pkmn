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
    const players = room.players.map((player) => {
      const newPlayer = users.data.filter((p) => p.id === player.id)[0];
      return {
        name: newPlayer.name,
        skin: newPlayer.user_profile.inventory[0].colors[0],
      };
    });

    returnedRooms.push({
      id: room.id,
      players: players,
      created_at: room.created_at,
    });
  }
  res.json(returnedRooms);
});

module.exports = router;
