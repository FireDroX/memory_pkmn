const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

module.exports = (io) => {
  io.on("connection", (socket) => {
    // Listen for the "user-connected" event
    socket.on("user-connected", async ({ name, id }) => {
      const { data: roomData, error: fetchError } = await supabase
        .from("rooms")
        .select("*")
        .eq("id", id)
        .single();

      const userIndex = roomData.players.findIndex(
        (player) => player.name === name
      );

      roomData.players[userIndex].ready = true;

      if (
        roomData.players.filter((player) => player.ready === true).length ===
        roomData.players.length
      ) {
        const randomName =
          roomData.players[Math.floor(Math.random() * roomData.players.length)]
            .name;
        roomData.playerTurn = randomName;
      }

      try {
        // Send the updated data back to Supabase
        const { error: updateError } = await supabase
          .from("rooms")
          .update({
            players: roomData.players,
            playerTurn: roomData.playerTurn,
          })
          .eq("id", id);

        if (updateError) throw updateError;
      } catch (error) {
        console.error("Error updating room:", error);
      }

      io.emit("refresh-room", roomData);
    });
  });
};
