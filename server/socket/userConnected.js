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

      if (name === roomData.player1.name) {
        roomData.player1.ready = true;
      } else if (name === roomData.player2.name) {
        roomData.player2.ready = true;
      }

      try {
        // Send the updated data back to Supabase
        const { error: updateError } = await supabase
          .from("rooms")
          .update({
            player1: roomData.player1,
            player2: roomData.player2,
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
