import "./Profile.css";
import "../../utils/CustomColors.css";
import { useState, useContext, useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import { IoIosRefresh } from "react-icons/io";
import { FaTrashAlt } from "react-icons/fa";
import { UserContext } from "../../utils/UserContext";

const Profile = () => {
  const { name, setName, setIsLoggedIn, userProfile } = useContext(UserContext);
  const navigate = useNavigate();
  const [status, setStatus] = useState();
  const [gamesArray, setGamesArray] = useState([]);
  const [gamePairs, setGamePairs] = useState({ c: 4, r: 7 });
  const [players, setPlayers] = useState([
    { name: name, enabled: true },
    { name: "", enabled: true },
    { name: "", enabled: false },
    { name: "", enabled: false },
  ]);

  const [delayed, setDelayed] = useState({
    load: false,
    invite: false,
    delete: false,
  });

  const handleInvite = async () => {
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        players: players
          .filter((player) => player.enabled)
          .map((player) => player.name),
        pairs: gamePairs,
      }),
    };

    if (
      players.filter((player) => player.enabled && player.name.trim() === "")
        .length > 0
    )
      setStatus("Name can't be empty.");
    else if (
      players
        .filter((player, index) => player.enabled && index !== 0)
        .includes(name)
    )
      setStatus("You can't invite yourself !");
    else if (
      players.filter((player, index) => player.enabled && index !== 0)
        .length === 0
    )
      setStatus("You need to invite at least one player !");
    else {
      const data = await fetch("/invite", requestOptions);
      const json = await data.json();

      setStatus(json?.status);
    }

    setPlayers([
      { name: name, enabled: true },
      { name: "", enabled: true },
      { name: "", enabled: false },
      { name: "", enabled: false },
    ]);

    getInvitations();
  };

  const getInvitations = async () => {
    const data = await fetch("/invites");
    const json = await data.json();

    setGamesArray(json);
  };

  const handleNavigate = (id) => {
    navigate(`?query=online&id=${id}`);
  };

  const handleDelete = async (id) => {
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ room: id, name: name }),
    };

    const data = await fetch("/rooms/delete", requestOptions);
    const json = await data.json();

    setStatus(json?.status);
    getInvitations();
  };

  const handleDisconnect = () => {
    window.localStorage.removeItem("super-secret-login-info");
    setName("");
    setIsLoggedIn(false);
    navigate("");
  };

  const stringToDecimal = (str) => {
    let decimal = 0;
    str.split("").map((char) => (decimal += char.charCodeAt(0)));
    return ((decimal - 1) % 1025) + 1;
  };

  useLayoutEffect(() => {
    getInvitations();
  }, []);

  return (
    <section className="App">
      <div>
        <div className="profile-container">
          <div className="profile-infos">
            <div className="profile-username">
              <img
                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${stringToDecimal(
                  name
                )}.png`}
                alt="User"
                draggable={false}
              />
              <h5
                className={userProfile.inventory[0].colors[0]}
                data-name={name}
                onClick={() => navigate("?query=colors")}
              >
                {name}
              </h5>
            </div>
            <p style={{ color: "red", fontSize: "10px" }}>{status}</p>
            <div className="profile-invite">
              <div className="profile-inputs">
                {players.map((player, index) => (
                  <div
                    className="profile-player-input"
                    key={"player-input-" + index}
                  >
                    <div>
                      <p>Player {index + 1}</p>
                      <input
                        type="checkbox"
                        name="player-enabled"
                        checked={player.enabled}
                        disabled={index === 0 ? true : false}
                        onChange={() => {
                          const updatedPlayers = [...players]; // Create a copy of the array
                          updatedPlayers[index].enabled =
                            !updatedPlayers[index].enabled; // Update the specific index
                          if (updatedPlayers[index].enabled === false)
                            updatedPlayers[index].name = "";
                          setPlayers(updatedPlayers); // Set the new array as state
                        }}
                      />
                    </div>
                    <input
                      type="text"
                      name="player"
                      value={player.name}
                      disabled={index === 0 ? true : !player.enabled}
                      onChange={(e) => {
                        const updatedPlayers = [...players]; // Create a copy of the array
                        updatedPlayers[index].name = e.target.value; // Update the specific index
                        setPlayers(updatedPlayers); // Set the new array as state
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="profile-pairs-buttons">
                {[
                  { c: 4, r: 5 },
                  { c: 4, r: 7 },
                  { c: 4, r: 9 },
                  { c: 4, r: 11 },
                ].map((pairs, index) => (
                  <button
                    key={index}
                    className="profile-disconnect"
                    onClick={() => setGamePairs(pairs)}
                    style={{
                      backgroundColor:
                        (gamePairs.c * gamePairs.r) / 2 ===
                        (pairs.c * pairs.r) / 2
                          ? "var(--secondary50)"
                          : "var(--primary65)",
                    }}
                  >
                    {(pairs.c * pairs.r) / 2}
                  </button>
                ))}
                <p>Pairs</p>
              </div>
              <div className="profile-buttons-joining">
                <button
                  disabled={delayed.invite}
                  className="profile-disconnect"
                  onClick={() => {
                    handleInvite();
                    setDelayed((prev) => ({
                      ...prev,
                      invite: !prev.invite,
                    }));
                    setTimeout(() => {
                      setDelayed((prev) => ({
                        ...prev,
                        invite: !prev.invite,
                      }));
                    }, 5000);
                  }}
                >
                  Invite
                </button>
              </div>
            </div>
            <button className="profile-disconnect" onClick={() => navigate("")}>
              Home
            </button>
          </div>
          <div className="profile-invites">
            <h5>
              Invites :{" "}
              <IoIosRefresh
                onClick={() => {
                  if (delayed.load) return;
                  getInvitations();
                  setDelayed((prev) => ({
                    ...prev,
                    load: !prev.load,
                  }));
                  setTimeout(() => {
                    setDelayed((prev) => ({
                      ...prev,
                      load: !prev.load,
                    }));
                  }, 5000);
                }}
              />
            </h5>
            <div className="profile-invitesList">
              {gamesArray
                .sort(
                  (a, b) =>
                    new Date(b.created_at).getTime() -
                    new Date(a.created_at).getTime()
                )
                .map((game, i) => {
                  const parameters = {
                    onClick: () => handleNavigate(game.id),
                    style: { fontWeight: 700 },
                  };

                  return (
                    <p key={i}>
                      {game.players.map((player, player_index, array) => (
                        <>
                          <strong
                            className={player.skin}
                            data-name={player.name}
                          >
                            {player.name}
                          </strong>
                          <small>
                            {player_index < array.length - 1 && " vs "}
                          </small>
                        </>
                      ))}{" "}
                      : <span {...parameters}>JOIN</span>
                      {game.players[0].name === name ? (
                        <FaTrashAlt
                          onClick={() => {
                            if (delayed.delete) return;
                            handleDelete(game.id);
                            setDelayed((prev) => ({
                              ...prev,
                              delete: !prev.delete,
                            }));
                            setTimeout(() => {
                              setDelayed((prev) => ({
                                ...prev,
                                delete: !prev.delete,
                              }));
                            }, 5000);
                          }}
                        />
                      ) : (
                        false
                      )}
                    </p>
                  );
                })}
            </div>
            <button
              className="profile-disconnect profile-leaderboard"
              onClick={() => navigate("?query=leaderboard")}
            >
              Leaderboard
            </button>
          </div>
        </div>
        <button
          className="profile-disconnect"
          onClick={handleDisconnect}
          style={{ position: "absolute", bottom: 15, right: 15 }}
        >
          Disconnect
        </button>
      </div>
    </section>
  );
};

export default Profile;
