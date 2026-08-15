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
import { useTranslation } from "react-i18next";
import { IoIosRefresh } from "react-icons/io";
import {
  FaCheck,
  FaCalendarCheck,
  FaChartLine,
  FaGamepad,
  FaGift,
  FaPalette,
  FaSignOutAlt,
  FaTrashAlt,
  FaTrophy,
  FaUserPlus,
  FaUsers,
} from "react-icons/fa";
import { UserContext } from "../../utils/UserContext";
import { createFriendDuel } from "../../utils/friendDuelInvite";
import { translateServerStatus } from "../../utils/serverStatus";
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
  const { t, i18n } = useTranslation();
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
  const [dailyChallenges, setDailyChallenges] = useState({
    date: "",
    challenges: [],
  });
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

  const getDailyChallenges = async () => {
    const response = await fetch(
      `/api/daily-challenges?name=${encodeURIComponent(name)}`,
    );
    if (!response.ok) return;
    setDailyChallenges(await response.json());
  };

  const claimChallenge = async (challengeId) => {
    const response = await fetch("/api/daily-challenges/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, challengeId }),
    });
    const data = await response.json();
    setStatus(translateServerStatus(data.status, t));
    if (response.ok) {
      setUserProfile(data.profile);
      await getDailyChallenges();
    }
  };

  const updateFriendship = async (path, friendName, method = "POST") => {
    const response = await fetch(`/api/friends${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, friendName }),
    });
    const data = await response.json();
    setStatus(translateServerStatus(data.status, t));
    if (response.ok) {
      setSelectedFriend("");
      await getFriends();
    }
  };

  const inviteFriend = async (friendName) => {
    const result = await createFriendDuel({
      ownerName: name,
      friendName,
      pairs: gamePairs,
    });

    setStatus(translateServerStatus(result.status, t));
    if (result.ok) {
      setPlayers([
        { name, enabled: true },
        { name: "", enabled: true },
        { name: "", enabled: false },
        { name: "", enabled: false },
      ]);
      await getInvitations();
    }
  };

  const handleInvite = async () => {
    const activePlayers = players.filter((player) => player.enabled);
    const selectedNames = activePlayers.map((player) => player.name);

    if (activePlayers.some((player) => player.name.trim() === "")) {
      return setStatus(t("profile.validation.selectPlayers"));
    }
    if (selectedNames.length !== new Set(selectedNames).size) {
      return setStatus(t("profile.validation.uniquePlayers"));
    }
    if (activePlayers.length < 2) {
      return setStatus(t("profile.validation.minimumPlayers"));
    }

    const response = await fetch("/api/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ players: selectedNames, pairs: gamePairs }),
    });
    const data = await response.json();
    setStatus(translateServerStatus(data.status, t));
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
    setStatus(translateServerStatus(data.status, t));
    await getInvitations();
  };

  const handleDisconnect = () => {
    setName("");
    setIsLoggedIn(false);
    setUserStats({
      onlineGamesPlayed: 0,
      onlineGamesWon: 0,
      onlineGamesLost: 0,
      onlineWinRate: 0,
      currentWinStreak: 0,
      bestWinStreak: 0,
      totalPairsFound: 0,
      shinyPairsFound: 0,
      soloGamesPlayed: 0,
      soloGamesWon: 0,
      soloWinRate: 0,
      soloBestRemainingTries: 0,
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
      getDailyChallenges(),
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
              <span className="eyebrow">{t("profile.eyebrow")}</span>
              <h2
                className={
                  userProfile.inventory?.[0]?.colors?.[0] || "color-default"
                }
                data-name={name}
              >
                {name}
              </h2>
              <p>
                {t("profile.levelXp", {
                  level: userProfile.level,
                  xp: userProfile.xp,
                  needed: userProfile.xpNeeded,
                })}
              </p>
            </div>
          </div>

          <div className="trainer-stats">
            <div>
              <strong>{userStats.onlineGamesWon || 0}</strong>
              <span>{t("profile.wins")}</span>
            </div>
            <div>
              <strong>{userStats.shinyPairsFound || 0}</strong>
              <span>{t("profile.shiny")}</span>
            </div>
            <div>
              <strong>
                {unlockedAchievements.size}/{achievements.length}
              </strong>
              <span>{t("profile.achievements")}</span>
            </div>
          </div>

          <div className="trainer-actions">
            <button onClick={() => navigate("/profile/colors")}>
              <FaPalette />
              {t("profile.editColor")}
            </button>
            <button className="secondary" onClick={handleDisconnect}>
              <FaSignOutAlt />
              {t("profile.logout")}
            </button>
          </div>
        </section>

        <div className="profile-container">
          <div className="profile-infos">
            <span className="eyebrow">{t("profile.onlineEyebrow")}</span>
            <h5>{t("profile.createArena")}</h5>
            <p className="profile-subtitle">{t("profile.createHint")}</p>
            <p className="profile-status">{status}</p>

            <div className="profile-invite">
              <div className="profile-inputs">
                {players.map((player, index) => (
                  <div className="profile-player-input" key={index}>
                    <div>
                      <p>
                        {index === 0
                          ? t("profile.you")
                          : t("profile.player", { number: index + 1 })}
                      </p>
                      <input
                        type="checkbox"
                        checked={player.enabled}
                        disabled={index === 0}
                        aria-label={t("profile.enablePlayer", {
                          number: index + 1,
                        })}
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
                      <option value="">{t("common.choose")}</option>
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
                <p>{t("profile.pairs")}</p>
              </div>

              <div className="profile-buttons-joining">
                <button className="profile-disconnect" onClick={handleInvite}>
                  {t("profile.createRoom")}
                </button>
              </div>
            </div>

            <button
              className="profile-disconnect secondary"
              onClick={() => navigate("/")}
            >
              {t("profile.playSolo")}
            </button>
          </div>

          <div className="profile-invites">
            <h5>
              {t("profile.joinArena")}
              <button
                className={isRefreshing ? "refreshing" : ""}
                onClick={refresh}
                aria-label={t("profile.refreshRooms")}
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
                          <small>{t("common.versus")}</small>
                        )}
                      </Fragment>
                    ))}
                    <span onClick={() => navigate(`/online?id=${game.id}`)}>
                      {t("profile.join")}
                    </span>
                    {game.players[0]?.name === name && (
                      <FaTrashAlt onClick={() => handleDelete(game.id)} />
                    )}
                  </p>
                ))}
              {gamesArray.length === 0 && (
                <p className="profile-invites-empty">
                  {t("profile.noRooms")}
                </p>
              )}
            </div>

            <button
              className="profile-disconnect profile-leaderboard"
              onClick={() => navigate("/profile/leaderboard")}
            >
              <FaTrophy />
              {t("profile.viewLeaderboard")}
            </button>
          </div>
        </div>

        <section className="daily-challenges-panel">
          <div className="daily-challenges-heading">
            <div>
              <span className="eyebrow">{t("daily.eyebrow")}</span>
              <h3>
                <FaCalendarCheck /> {t("daily.title")}
              </h3>
            </div>
            <p>{t("daily.refresh")}</p>
          </div>
          <div className="daily-challenges-grid">
            {dailyChallenges.challenges.map((challenge) => {
              const percentage = Math.min(
                100,
                (challenge.progress / challenge.target) * 100,
              );
              return (
                <article
                  className={challenge.completed ? "completed" : ""}
                  key={challenge.id}
                >
                  <div className="daily-challenge-copy">
                    <span>{challenge.rewardXp} XP</span>
                    <h4>
                      {t(`daily.challenges.${challenge.id}.title`, {
                        defaultValue: challenge.title,
                      })}
                    </h4>
                    <p>
                      {t(`daily.challenges.${challenge.id}.description`, {
                        defaultValue: challenge.description,
                      })}
                    </p>
                  </div>
                  <div className="daily-challenge-progress">
                    <span style={{ width: `${percentage}%` }} />
                  </div>
                  <div className="daily-challenge-footer">
                    <strong>
                      {challenge.progress}/{challenge.target}
                    </strong>
                    {challenge.completed && !challenge.claimed && (
                      <button onClick={() => claimChallenge(challenge.id)}>
                        <FaGift /> {t("daily.claim")}
                      </button>
                    )}
                    {challenge.claimed && <span>{t("daily.claimed")}</span>}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="detailed-stats-panel">
          <div className="detailed-stats-heading">
            <div>
              <span className="eyebrow">{t("stats.eyebrow")}</span>
              <h3>
                <FaChartLine /> {t("stats.title")}
              </h3>
            </div>
            {userStats.createdAt && (
              <p>
                {t("stats.trainerSince", {
                  date: new Intl.DateTimeFormat(
                    i18n.resolvedLanguage === "en" ? "en-GB" : "fr-FR",
                  ).format(new Date(userStats.createdAt)),
                })}
              </p>
            )}
          </div>
          <div className="detailed-stats-groups">
            <article>
              <h4>{t("stats.online")}</h4>
              <dl>
                <div><dt>{t("stats.games")}</dt><dd>{userStats.onlineGamesPlayed}</dd></div>
                <div><dt>{t("stats.wins")}</dt><dd>{userStats.onlineGamesWon}</dd></div>
                <div><dt>{t("stats.losses")}</dt><dd>{userStats.onlineGamesLost}</dd></div>
                <div><dt>{t("stats.winRate")}</dt><dd>{userStats.onlineWinRate}%</dd></div>
                <div><dt>{t("stats.currentStreak")}</dt><dd>{userStats.currentWinStreak}</dd></div>
                <div><dt>{t("stats.bestStreak")}</dt><dd>{userStats.bestWinStreak}</dd></div>
              </dl>
            </article>
            <article>
              <h4>{t("stats.soloCollection")}</h4>
              <dl>
                <div><dt>{t("stats.soloGames")}</dt><dd>{userStats.soloGamesPlayed}</dd></div>
                <div><dt>{t("stats.soloWins")}</dt><dd>{userStats.soloGamesWon}</dd></div>
                <div><dt>{t("stats.soloRate")}</dt><dd>{userStats.soloWinRate}%</dd></div>
                <div><dt>{t("stats.bestRemaining")}</dt><dd>{t("stats.tries", { count: userStats.soloBestRemainingTries })}</dd></div>
                <div><dt>{t("stats.pairsFound")}</dt><dd>{userStats.totalPairsFound}</dd></div>
                <div><dt>{t("stats.shinyPairs")}</dt><dd>{userStats.shinyPairsFound}</dd></div>
              </dl>
            </article>
          </div>
        </section>

        <section className="friends-panel">
          <div className="friends-heading">
            <div>
              <span className="eyebrow">{t("friends.eyebrow")}</span>
              <h3><FaUsers /> {t("friends.title")}</h3>
            </div>
            <div className="friend-request-form">
              <select
                value={selectedFriend}
                onChange={(event) => setSelectedFriend(event.target.value)}
                aria-label={t("friends.playerToAdd")}
              >
                <option value="">{t("friends.choosePlayer")}</option>
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
                <FaUserPlus /> {t("friends.add")}
              </button>
            </div>
          </div>

          {friends.incoming.length > 0 && (
            <div className="friend-requests">
              <strong>{t("friends.requests")}</strong>
              {friends.incoming.map((friend) => (
                <span key={friend}>
                  {friend}
                  <button onClick={() => updateFriendship("/accept", friend)}>
                    <FaCheck /> {t("friends.accept")}
                  </button>
                  <button
                    className="friend-remove"
                    aria-label={t("friends.reject", { name: friend })}
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
                  <FaGamepad /> {t("friends.invite")}
                </button>
                <button
                  className="friend-remove"
                  aria-label={t("friends.remove", { name: friend })}
                  onClick={() => updateFriendship("", friend, "DELETE")}
                >
                  <FaTrashAlt />
                </button>
              </article>
            ))}
            {friends.friends.length === 0 && (
              <p className="friends-empty">{t("friends.empty")}</p>
            )}
          </div>

          {friends.outgoing.length > 0 && (
            <p className="friend-outgoing">
              {t("friends.pending", { names: friends.outgoing.join(", ") })}
            </p>
          )}
        </section>

        <section className="achievements-panel">
          <div className="achievements-heading">
            <div>
              <span className="eyebrow">{t("achievements.eyebrow")}</span>
              <h3>{t("achievements.title")}</h3>
            </div>
            <p>
              {t("achievements.unlockedCount", {
                count: unlockedAchievements.size,
                total: achievements.length,
              })}
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
                    <span>
                      {t(
                        unlocked
                          ? "achievements.unlocked"
                          : "achievements.locked",
                      )}
                    </span>
                    <h4>
                      {t(`achievements.items.${achievement.id}.name`, {
                        defaultValue: achievement.name,
                      })}
                    </h4>
                    <p>
                      {t(`achievements.items.${achievement.id}.description`, {
                        defaultValue: achievement.description,
                      })}
                    </p>
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
