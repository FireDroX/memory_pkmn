import "./Profile.css";
import "../../utils/CustomColors.css";
import {
  Fragment,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router";
import { IoIosRefresh } from "react-icons/io";
import {
  FaCheck,
  FaGamepad,
  FaPalette,
  FaSignOutAlt,
  FaTrashAlt,
  FaTrophy,
  FaUserPlus,
  FaUsers,
} from "react-icons/fa";
import { UserContext } from "../../utils/UserContext";
import {
  achievements,
  getUnlockedAchievementIds,
} from "../../utils/achievements";

const pokemonForName = (name) => {
  const total = [...name].reduce(
    (value, character) => value + character.charCodeAt(0),
    0,
  );
  return ((total - 1) % 1025) + 1;
};

const Profile = () => {
  const {
    name,
    setName,
    setIsLoggedIn,
    userProfile,
    setUserProfile,
    userStats,
    setUserStats,
  } = useContext(UserContext);
  const navigate = useNavigate();
  const [status, setStatus] = useState("");
  const [gamesArray, setGamesArray] = useState([]);
  const [gamePairs, setGamePairs] = useState({ c: 4, r: 7 });
  const [users, setUsers] = useState([]);
  const [friends, setFriends] = useState({
    friends: [],
    incoming: [],
    outgoing: [],
  });
  const [selectedFriend, setSelectedFriend] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [players, setPlayers] = useState([
    { name, enabled: true },
    { name: "", enabled: true },
    { name: "", enabled: false },
    { name: "", enabled: false },
  ]);

  const unlockedAchievements = useMemo(
    () => getUnlockedAchievementIds(userProfile, userStats),
    [userProfile, userStats],
  );

  const getInvitations = async () => {
    const response = await fetch("/api/invites");
    const data = await response.json();
    setGamesArray(Array.isArray(data) ? data : []);
  };

  const getUsers = async () => {
    const response = await fetch("/api/profile/users");
    const data = await response.json();
    setUsers(data.users || []);
  };

  const getProfileSummary = async () => {
    const response = await fetch(
      `/api/profile/summary?name=${encodeURIComponent(name)}`,
    );
    if (!response.ok) return;

    const data = await response.json();
    setUserProfile(data.profile);
    setUserStats(data.stats);
  };

  const getFriends = async () => {
    const response = await fetch(
      `/api/friends?name=${encodeURIComponent(name)}`,
    );
    if (!response.ok) return;
    setFriends(await response.json());
  };

  const updateFriendship = async (path, friendName, method = "POST") => {
    const response = await fetch(`/api/friends${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, friendName }),
    });
    const data = await response.json();
    setStatus(data.status || "");
    if (response.ok) {
      setSelectedFriend("");
      await getFriends();
    }
  };

  const inviteFriend = (friendName) => {
    const freeIndex = players.findIndex(
      (player, index) => index > 0 && (!player.enabled || !player.name),
    );
    if (freeIndex === -1) {
      return setStatus("Les quatre places de l'arene sont deja occupees.");
    }
    const updatedPlayers = structuredClone(players);
    updatedPlayers[freeIndex] = { name: friendName, enabled: true };
    setPlayers(updatedPlayers);
    setStatus(`${friendName} a ete ajoute a l'invitation.`);
  };

  const handleInvite = async () => {
    const activePlayers = players.filter((player) => player.enabled);
    const selectedNames = activePlayers.map((player) => player.name);

    if (activePlayers.some((player) => player.name.trim() === "")) {
      return setStatus("Selectionne un joueur pour chaque place active.");
    }
    if (selectedNames.length !== new Set(selectedNames).size) {
      return setStatus("Chaque place doit contenir un joueur different.");
    }
    if (activePlayers.length < 2) {
      return setStatus("Invite au moins un autre joueur.");
    }

    const response = await fetch("/api/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ players: selectedNames, pairs: gamePairs }),
    });
    const data = await response.json();
    setStatus(data.status || "");
    setPlayers([
      { name, enabled: true },
      { name: "", enabled: true },
      { name: "", enabled: false },
      { name: "", enabled: false },
    ]);
    await getInvitations();
  };

  const handleDelete = async (room) => {
    const response = await fetch("/api/rooms/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ room, name }),
    });
    const data = response.status === 204 ? {} : await response.json();
    setStatus(data.status || "");
    await getInvitations();
  };

  const handleDisconnect = () => {
    setName("");
    setIsLoggedIn(false);
    setUserStats({
      onlineGamesWon: 0,
      shinyPairsFound: 0,
      createdAt: null,
    });
    navigate("/");
  };

  const refresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    await Promise.all([
      getInvitations(),
      getUsers(),
      getProfileSummary(),
      getFriends(),
    ]);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  useLayoutEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    const interval = setInterval(getInvitations, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="App profile-page">
      <div className="profile-page-content">
        <section className="trainer-overview">
          <div className="trainer-identity">
            <div className="trainer-avatar">
              <img
                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonForName(
                  name,
                )}.png`}
                alt=""
                draggable={false}
              />
            </div>
            <div>
              <span className="eyebrow">PROFIL DRESSEUR</span>
              <h2
                className={
                  userProfile.inventory?.[0]?.colors?.[0] || "color-default"
                }
                data-name={name}
              >
                {name}
              </h2>
              <p>
                Niveau {userProfile.level} ·{" "}
                {userProfile.xp}/{userProfile.xpNeeded} XP
              </p>
            </div>
          </div>

          <div className="trainer-stats">
            <div>
              <strong>{userStats.onlineGamesWon || 0}</strong>
              <span>Victoires</span>
            </div>
            <div>
              <strong>{userStats.shinyPairsFound || 0}</strong>
              <span>Shiny</span>
            </div>
            <div>
              <strong>
                {unlockedAchievements.size}/{achievements.length}
              </strong>
              <span>Succes</span>
            </div>
          </div>

          <div className="trainer-actions">
            <button onClick={() => navigate("/profile/colors")}>
              <FaPalette />
              Modifier la couleur
            </button>
            <button className="secondary" onClick={handleDisconnect}>
              <FaSignOutAlt />
              Deconnexion
            </button>
          </div>
        </section>

        <div className="profile-container">
          <div className="profile-infos">
            <span className="eyebrow">MODE EN LIGNE</span>
            <h5>Creer une arene</h5>
            <p className="profile-subtitle">
              Compose ton equipe, choisis la grille et lance l'invitation.
            </p>
            <p className="profile-status">{status}</p>

            <div className="profile-invite">
              <div className="profile-inputs">
                {players.map((player, index) => (
                  <div className="profile-player-input" key={index}>
                    <div>
                      <p>{index === 0 ? "Toi" : `Joueur ${index + 1}`}</p>
                      <input
                        type="checkbox"
                        checked={player.enabled}
                        disabled={index === 0}
                        aria-label={`Activer le joueur ${index + 1}`}
                        onChange={() => {
                          const updatedPlayers = structuredClone(players);
                          updatedPlayers[index].enabled =
                            !updatedPlayers[index].enabled;
                          if (!updatedPlayers[index].enabled) {
                            updatedPlayers[index].name = "";
                          }
                          setPlayers(updatedPlayers);
                        }}
                      />
                    </div>
                    <select
                      disabled={index === 0 || !player.enabled}
                      value={player.name}
                      onChange={(event) => {
                        const updatedPlayers = structuredClone(players);
                        updatedPlayers[index].name = event.target.value;
                        setPlayers(updatedPlayers);
                      }}
                    >
                      <option value="">Choisir...</option>
                      {users
                        .filter(
                          (user) =>
                            user !== name &&
                            !players.some(
                              (entry, playerIndex) =>
                                playerIndex !== index && entry.name === user,
                            ),
                        )
                        .map((user) => (
                          <option key={user} value={user}>
                            {user}
                          </option>
                        ))}
                    </select>
                  </div>
                ))}
              </div>

              <div className="profile-pairs-buttons">
                {[
                  { columns: 4, rows: 7 },
                  { columns: 4, rows: 9 },
                  { columns: 4, rows: 11 },
                ].map((pairs) => (
                  <button
                    key={pairs.rows}
                    className="profile-disconnect"
                    onClick={() =>
                      setGamePairs({ c: pairs.columns, r: pairs.rows })
                    }
                    data-active={
                      gamePairs.c === pairs.columns && gamePairs.r === pairs.rows
                    }
                  >
                    {(pairs.columns * pairs.rows) / 2}
                  </button>
                ))}
                <p>paires</p>
              </div>

              <div className="profile-buttons-joining">
                <button className="profile-disconnect" onClick={handleInvite}>
                  Creer le salon
                </button>
              </div>
            </div>

            <button
              className="profile-disconnect secondary"
              onClick={() => navigate("/")}
            >
              Jouer en solo
            </button>
          </div>

          <div className="profile-invites">
            <h5>
              Rejoindre une arene
              <button
                className={isRefreshing ? "refreshing" : ""}
                onClick={refresh}
                aria-label="Actualiser les salons"
              >
                <IoIosRefresh />
              </button>
            </h5>

            <div className="profile-invitesList">
              {[...gamesArray]
                .sort(
                  (a, b) =>
                    new Date(b.created_at).getTime() -
                    new Date(a.created_at).getTime(),
                )
                .map((game) => (
                  <p key={game.id}>
                    {game.players.map((player, playerIndex) => (
                      <Fragment key={`${game.id}-${player.name}`}>
                        <strong
                          className={player.skin}
                          data-name={player.name}
                        >
                          {player.name}
                        </strong>
                        {playerIndex < game.players.length - 1 && (
                          <small>vs</small>
                        )}
                      </Fragment>
                    ))}
                    <span onClick={() => navigate(`/online?id=${game.id}`)}>
                      REJOINDRE
                    </span>
                    {game.players[0]?.name === name && (
                      <FaTrashAlt onClick={() => handleDelete(game.id)} />
                    )}
                  </p>
                ))}
            </div>

            <button
              className="profile-disconnect profile-leaderboard"
              onClick={() => navigate("/profile/leaderboard")}
            >
              <FaTrophy />
              Voir le classement
            </button>
          </div>
        </div>

        <section className="friends-panel">
          <div className="friends-heading">
            <div>
              <span className="eyebrow">SOCIAL</span>
              <h3><FaUsers /> Liste d'amis</h3>
            </div>
            <div className="friend-request-form">
              <select
                value={selectedFriend}
                onChange={(event) => setSelectedFriend(event.target.value)}
                aria-label="Joueur a ajouter"
              >
                <option value="">Choisir un joueur...</option>
                {users
                  .filter(
                    (user) =>
                      user !== name &&
                      !friends.friends.includes(user) &&
                      !friends.incoming.includes(user) &&
                      !friends.outgoing.includes(user),
                  )
                  .map((user) => <option key={user}>{user}</option>)}
              </select>
              <button
                disabled={!selectedFriend}
                onClick={() => updateFriendship("/request", selectedFriend)}
              >
                <FaUserPlus /> Ajouter
              </button>
            </div>
          </div>

          {friends.incoming.length > 0 && (
            <div className="friend-requests">
              <strong>Demandes recues</strong>
              {friends.incoming.map((friend) => (
                <span key={friend}>
                  {friend}
                  <button onClick={() => updateFriendship("/accept", friend)}>
                    <FaCheck /> Accepter
                  </button>
                  <button
                    className="friend-remove"
                    aria-label={`Refuser ${friend}`}
                    onClick={() => updateFriendship("", friend, "DELETE")}
                  >
                    <FaTrashAlt />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="friends-grid">
            {friends.friends.map((friend) => (
              <article key={friend}>
                <img
                  src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonForName(friend)}.png`}
                  alt=""
                  draggable={false}
                />
                <strong>{friend}</strong>
                <button onClick={() => inviteFriend(friend)}>
                  <FaGamepad /> Inviter
                </button>
                <button
                  className="friend-remove"
                  aria-label={`Supprimer ${friend} de la liste d'amis`}
                  onClick={() => updateFriendship("", friend, "DELETE")}
                >
                  <FaTrashAlt />
                </button>
              </article>
            ))}
            {friends.friends.length === 0 && (
              <p className="friends-empty">Ajoute un joueur pour le retrouver ici et l'inviter rapidement.</p>
            )}
          </div>

          {friends.outgoing.length > 0 && (
            <p className="friend-outgoing">
              En attente : {friends.outgoing.join(", ")}
            </p>
          )}
        </section>

        <section className="achievements-panel">
          <div className="achievements-heading">
            <div>
              <span className="eyebrow">COLLECTION</span>
              <h3>Succes</h3>
            </div>
            <p>
              {unlockedAchievements.size} debloque
              {unlockedAchievements.size > 1 ? "s" : ""} sur{" "}
              {achievements.length}
            </p>
          </div>

          <div className="achievements-grid">
            {achievements.map((achievement) => {
              const unlocked = unlockedAchievements.has(achievement.id);
              return (
                <article
                  className={`achievement-card ${unlocked ? "unlocked" : "locked"}`}
                  key={achievement.id}
                >
                  <span className="achievement-icon">
                    {achievement.image ? (
                      <img src={achievement.image} alt="" />
                    ) : (
                      achievement.icon
                    )}
                  </span>
                  <div>
                    <span>{unlocked ? "DEBLOQUE" : "VERROUILLE"}</span>
                    <h4>{achievement.name}</h4>
                    <p>{achievement.description}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </section>
  );
};

export default Profile;
