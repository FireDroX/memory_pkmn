import "./Profile.css";
import { useState, useContext, useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import { IoIosRefresh } from "react-icons/io";
import { FaTrashAlt } from "react-icons/fa";
import { UserContext } from "../../utils/UserContext";

const Profile = () => {
  const { name, setName, setIsLoggedIn } = useContext(UserContext);
  const navigate = useNavigate();
  const [status, setStatus] = useState();
  const [invitedPlayers, setInvitedPlayers] = useState("");
  const [gamesArray, setGamesArray] = useState([]);
  const [gamePairs, setGamePairs] = useState({ c: 4, r: 7 });
  const [shinyMode, setShinyMode] = useState(false);

  const handleInvite = async () => {
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        createdBy: name,
        invitedPlayer: invitedPlayers,
        pairs: gamePairs,
        isShiny: shinyMode,
      }),
    };

    if (invitedPlayers === "")
      setStatus("Enter someone first before inviting.");
    else if (name === invitedPlayers) setStatus("You can't invite yourself !");
    else {
      const data = await fetch("/invite", requestOptions);
      const json = await data.json();

      setStatus(json?.status);
    }
    setInvitedPlayers("");
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
              <h5>{name}</h5>
            </div>
            <p style={{ color: "red", fontSize: "10px" }}>{status}</p>
            <div className="profile-invite">
              <p>Invite a Player</p>
              <input
                type="text"
                name="player"
                value={invitedPlayers}
                onChange={(e) => setInvitedPlayers(e.target.value)}
              />
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
              <button className="profile-disconnect" onClick={handleInvite}>
                Invite
              </button>
            </div>
            <div className="shinyMode-selector">
              <h6
                className={!shinyMode ? "shinyMode-text" : ""}
                style={{ color: !shinyMode ? "unset" : "var(--text45)" }}
              >
                {" "}
                NOT SHINY
              </h6>
              <label className="shinyMode-switch">
                <input
                  type="checkbox"
                  name="difficulty"
                  onChange={() => setShinyMode(!shinyMode)}
                />
                <span className="shinyMode-slider shinyMode-round"></span>
              </label>
              <h6
                className={shinyMode ? "shinyMode-text" : ""}
                style={{ color: shinyMode ? "unset" : "var(--text45)" }}
              >
                SHINY
              </h6>
            </div>
            <button className="profile-disconnect" onClick={() => navigate("")}>
              Home
            </button>
          </div>
          <div className="profile-invites">
            <h5>
              Invites : <IoIosRefresh onClick={getInvitations} />
            </h5>
            <div className="profile-invitesList">
              {gamesArray
                .sort(
                  (a, b) =>
                    new Date(b.created_at).getTime() -
                    new Date(a.created_at).getTime()
                )
                .map((game, i) => {
                  if (name === game.player1) {
                    return (
                      <p key={i}>
                        You invited <strong>{game.player2}</strong> :{" "}
                        <i onClick={() => handleNavigate(game.id)}>Join</i>
                        <FaTrashAlt onClick={() => handleDelete(game.id)} />
                      </p>
                    );
                  } else if (name === game.player2) {
                    return (
                      <p key={i}>
                        <strong>{game.player1}</strong> invited you :{" "}
                        <i onClick={() => handleNavigate(game.id)}>Join</i>
                      </p>
                    );
                  } else {
                    return (
                      <p key={i}>
                        <strong>{game.player1}</strong> vs{" "}
                        <strong>{game.player2}</strong>:{" "}
                        <i onClick={() => handleNavigate(game.id)}>Join</i>
                      </p>
                    );
                  }
                })}
            </div>
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
