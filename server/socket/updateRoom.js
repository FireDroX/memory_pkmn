const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

module.exports = (io) => {
  io.on("connection", (socket) => {
    socket.on("update-room", async ({ room, cards, player, pair }) => {
      const users = await supabase.from("users").select();
      const { data: roomData, error: fetchError } = await supabase
        .from("rooms")
        .select("*")
        .eq("id", room)
        .single();

      if (!roomData) return;
      const newPlayer = users.data.filter((p) => p.name === player)[0];
      if (
        ![roomData.player1.name, roomData.player2.name].includes(newPlayer.name)
      )
        return;

      try {
        if (fetchError) throw fetchError;

        // Check current players and update scores if `isPair`
        if (pair.isPair) {
          if (roomData.player1.name === newPlayer.name) {
            roomData.player1.score += 1;
          }
          if (roomData.player2.name === newPlayer.name) {
            roomData.player2.score += 1;
          }

          let cardsLeft = cards.flat(1).length || undefined;

          cards.forEach((coll, _) => {
            coll.forEach((card, _) => {
              if ([2, 3].includes(card.state)) {
                cardsLeft -= 1;
              }
            });
          });

          if (cardsLeft === 0) {
            // Send the updated data back to Supabase
            const { error: updateUserError } = await supabase
              .from("users")
              .update({
                online_games_won: newPlayer.online_games_won + 1,
              })
              .eq("id", newPlayer.id);

            if (updateUserError) throw updateUserError;
          }

          if (pair.shiny) {
            // Send the updated data back to Supabase
            const { error: updateUserError } = await supabase
              .from("users")
              .update({
                shiny_pairs_found: newPlayer.shiny_pairs_found + 1,
              })
              .eq("id", newPlayer.id);

            if (updateUserError) throw updateUserError;
          }
        } else {
          // Update playerTurn if not a pair
          roomData.playerTurn =
            roomData.player1.name === roomData.playerTurn
              ? roomData.player2.name
              : roomData.player1.name;
        }

        // Update cards in the room data
        roomData.cards = cards;

        // Send the updated data back to Supabase
        const { error: updateError } = await supabase
          .from("rooms")
          .update({
            player1: roomData.player1,
            player2: roomData.player2,
            playerTurn: roomData.playerTurn,
            cards: roomData.cards,
          })
          .eq("id", room);

        if (updateError) throw updateError;
      } catch (error) {
        console.error("Error updating room:", error);
      }

      io.emit("refresh-room", roomData);
    });
  });
};
