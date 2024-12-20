const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const levels = require("../utils/Levels");

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
        roomData.players.filter((player) => player.name === newPlayer.name)
          .length === 0
      )
        return;

      const playerIndex = roomData.players.findIndex(
        (player) => player.name === newPlayer.name
      );

      try {
        if (fetchError) throw fetchError;

        // Check current players and update scores if `isPair`
        if (pair.isPair) {
          roomData.players[playerIndex].score += 1;

          let cardsLeft = cards.flat(1).length || undefined;

          cards.forEach((coll, _) => {
            coll.forEach((card, _) => {
              if ([2, 3, 4, 5].includes(card.state)) {
                cardsLeft -= 1;
              }
            });
          });

          if (cardsLeft === 0) {
            const player = users.data.filter(
              (p) =>
                p.name ===
                [...roomData.players].sort((a, b) => b.score - a.score)[0].name
            )[0];

            // Add XP
            const XP = 15; // 15xp per online game won
            const { level, xp: xpOld, xpNeeded } = player.user_profile;
            const updatedUser = player.user_profile;
            if (xpOld + XP >= xpNeeded && levels.length > level + 1) {
              const newInfos = levels[level + 1];
              updatedUser.level = newInfos.level;
              updatedUser.xp = xpOld + XP - xpNeeded;
              updatedUser.xpNeeded = newInfos.xpNeeded;
              if (newInfos.rewards.colors.length > 0) {
                newInfos.rewards.colors.map((color) => {
                  if (!updatedUser.inventory[0].colors.includes(color)) {
                    updatedUser.inventory[0].colors.push(color);
                  }
                });
              }
            } else {
              updatedUser.xp = xpOld + XP;
            }

            // Send the updated data back to Supabase
            const { error: updateUserError } = await supabase
              .from("users")
              .update({
                online_games_won: player.online_games_won + 1,
                user_profile: updatedUser,
              })
              .eq("id", player.id);

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
            roomData.players[(playerIndex + 1) % roomData.players.length].name;
        }

        // Update cards in the room data
        roomData.cards = cards;

        // Send the updated data back to Supabase
        const { error: updateError } = await supabase
          .from("rooms")
          .update({
            players: roomData.players,
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
