const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const createRoomRoute = require("../express/createRoomRoute");

module.exports = (io) => {
  io.on("connection", (socket) => {
    // Listen for the "user-waiting" event
    socket.on("user-waiting", async ({ name }) => {
      // Step 1: Check if the user exists in the 'users' table
      const { data: userData, error: fetchError } = await supabase
        .from("users")
        .select("*")
        .eq("name", name)
        .single();

      if (fetchError || !userData) {
        return console.log("No data");
      }

      const userId = userData.id;

      // Step 2: Check if the user is already in the waiting list
      const { data: waitingData, error: waitingError } = await supabase
        .from("waiting-list")
        .select("*")
        .eq("id", userId)
        .single();

      if (waitingError || !waitingData) {
        // Add the user to the waiting list
        const { error: insertError } = await supabase
          .from("waiting-list")
          .insert([
            {
              id: userId,
              name: userData.name,
              socket_id: socket.id,
              joined_at: new Date(),
            },
          ]);

        if (insertError) {
          return console.log("Failed to insert");
        }

        // Step 3: Set a timeout to remove the user if still in the waiting list after 5 minutes
        setTimeout(async () => {
          // Check if the user is still in the waiting list
          const { data: stillWaitingData } = await supabase
            .from("waiting-list")
            .select("*")
            .eq("id", userId)
            .single();

          if (stillWaitingData) {
            // Remove the user from the waiting list
            await supabase.from("waiting-list").delete().eq("id", userId);
          }
        }, 2 * 60 * 1000); // 2 minutes in milliseconds
      }

      // Step 4: Check if there are two users in the waiting list
      const { data: allWaitingUsers } = await supabase
        .from("waiting-list")
        .select();

      if (allWaitingUsers && allWaitingUsers.length >= 2) {
        // Select the first two users
        const [user1, user2] = allWaitingUsers;

        // Step 3: Send POST request to /invite route
        const requestOptions = {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            createdBy: user1.name,
            invitedPlayer: user2.name,
            pairs: { c: 4, r: 7 },
          }),
        };

        // Send POST request to server /invite route
        try {
          const data = await fetch(
            `${
              process.env.NODE_ENV === "production"
                ? process.env.SERVER_ADRESS
                : "http://192.168.1.105:5000"
            }/invite`,
            requestOptions
          );
          const result = await data.json();

          if (!result?.roomID) throw new Error("No room");

          // Notify both users that a room has been created
          io.to(user1.socket_id).emit("room-created", {
            roomId: result?.roomID,
          });
          io.to(user2.socket_id).emit("room-created", {
            roomId: result?.roomID,
          });

          // Remove both users from the waiting list
          await supabase
            .from("waiting-list")
            .delete()
            .in("id", [user1.id, user2.id]);
        } catch (error) {
          console.error("Failed to create invite:", error);
        }
      }
    });
  });
};
