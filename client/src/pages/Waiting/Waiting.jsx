import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../utils/UserContext";
import { socket } from "../../socket";

import Loading from "../../components/Loading/Loading";

const Waiting = () => {
  const { name } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    // Connect to Socket.IO server on component mount
    socket.connect();
    socket.on("connection", handleJoinWaitingList());

    // Listen for "room-created" event
    socket.on("room-created", (data) => {
      navigate(`?query=online&id=${data.roomId}`);
    });

    // Listen for "waiting-disconnected" event
    socket.on("waiting-disconnected", () => {
      navigate("");
    });

    // Clean up event listeners on component unmount
    return () => {
      socket.disconnect();
      socket.off("connection");
      socket.off("room-created");
      socket.off("waiting-disconnected");
    };
  }, []);

  const handleJoinWaitingList = () => {
    if (name) {
      // Emit "user-waiting" event with user name
      socket.emit("user-waiting", { name });
    }
  };
  return (
    <section className="App">
      <div>
        <Loading />
      </div>
    </section>
  );
};

export default Waiting;
