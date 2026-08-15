export const createFriendDuel = async ({
  friendName,
  pairs,
  request = fetch,
}) => {
  try {
    const response = await request("/api/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ players: [friendName], pairs }),
    });
    const data = await response.json();

    return {
      ok: response.ok,
      status: data.status || "",
      roomID: data.roomID,
    };
  } catch {
    return {
      ok: false,
      status: "Creation du duel impossible.",
      roomID: undefined,
    };
  }
};
