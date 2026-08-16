import { useState, useContext, useEffect } from "react";
import { FaCrown } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import GameResult from "../../../components/GameResult/GameResult";
import { UserContext } from "../../../utils/UserContext";
import { socket } from "../../../socket";
import { pokemonIdFromName } from "../../../utils/pokemon";
import "../../../pages/Memory/Solo/Solo.css";
import "./Online.css";

import { Loading } from "../../../components/Loading/Loading";

const Online = ({ id }) => {
  const { name, isLoggedIn } = useContext(UserContext);
  const { t } = useTranslation();
  const [roomExists, setRoomExists] = useState(true);
  const [users, setUsers] = useState([]);
  const [cards, setCards] = useState([]);
  const [flippedCards, setFlippedCards] = useState([]);
  const [room, setRoom] = useState();
  const [endOfGame, setEndOfGame] = useState(false);
  const [isLandscape, setIsLandscape] = useState(true);

  const postRoomValues = (updatedCards) => {
    socket.emit("update-room", {
      room: id,
      cards: updatedCards,
    });
  };

  const getRoomValues = async () => {
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ room: id }),
    };

    const data = await fetch("/api/rooms/get", requestOptions);
    if (data.status === 204) return setRoomExists(false);

    const json = await data.json();
    setUsers(json.users);
    setRoom(json.room);
    setCards(json.room.cards);
  };

  const handleFlipCard = (coll, row, index) => {
    if (
      [2, 3, 4, 5].includes(cards[coll][row].state) ||
      flippedCards.some((c) => c.index === index)
    ) {
      // If the card is already matched or currently flipped, do nothing
      return;
    }

    const card = document.getElementsByClassName("card")[index];
    card.classList.add("card-flipped");
    const cardValue = Number(card.dataset.pokemon);

    const newFlippedCards = [
      ...flippedCards,
      { index, cardValue, coll, row },
    ];
    setFlippedCards(() => {
      if (newFlippedCards.length === 2) {
        const [firstCard, secondCard] = newFlippedCards;

        if (firstCard.cardValue === secondCard.cardValue) {
          // It's a match, keep them flipped
          setTimeout(() => {
            const updatedCards = cards.map((coll, collIndex) =>
              coll.map((card, rowIndex) => {
                // Check if the current card matches the first or second card
                if (
                  (collIndex === firstCard.coll &&
                    rowIndex === firstCard.row) ||
                  (collIndex === secondCard.coll && rowIndex === secondCard.row)
                ) {
                  // Return a new object with state updated to 2, 3, 4 or 5
                  return {
                    ...card,
                    state: users.findIndex((user) => user.name === name) + 2,
                  };
                } else if (card.state === 1) {
                  return { ...card, state: 0 };
                }
                // Otherwise, return the card as it is
                return card;
              }),
            );
            setCards(updatedCards);
            postRoomValues(updatedCards);
          }, 1200);
        } else {
          // Not a match, flip them back after a delay
          setTimeout(() => {
            document
              .getElementsByClassName("card")
              [firstCard.index].classList.remove("card-flipped");
            document
              .getElementsByClassName("card")
              [secondCard.index].classList.remove("card-flipped");

            const updatedCards = cards.map((coll, collIndex) =>
              coll.map((card, rowIndex) => {
                // Check if the current card matches the first or second card
                if (
                  (collIndex === firstCard.coll &&
                    rowIndex === firstCard.row) ||
                  (collIndex === secondCard.coll && rowIndex === secondCard.row)
                ) {
                  // Return a new object with state updated to 1
                  return { ...card, state: 1 };
                } else if (card.state === 1) {
                  return { ...card, state: 0 };
                }
                // Otherwise, return the card as it is
                return card;
              }),
            );
            setCards(updatedCards);
            postRoomValues(updatedCards);
          }, 1200);
        }
      }
      return newFlippedCards;
    });
  };

  useEffect(() => {
    const handleConnect = () => socket.emit("join-room", id);
    const handleRefresh = (updatedRoomValues) => {
      setRoom(updatedRoomValues);
      setCards(updatedRoomValues.cards);
      setFlippedCards([]);
    };

    socket.on("connect", handleConnect);
    socket.on("refresh-room", handleRefresh);
    socket.connect();
    getRoomValues();
    return () => {
      socket.off("connect", handleConnect);
      socket.off("refresh-room", handleRefresh);
      socket.disconnect();
    };
  }, [id]);

  useEffect(() => {
    let cardsLeft = cards.flat(1).length || undefined;

    const flipCards = (index) => {
      const card = document.getElementsByClassName("card")[index];
      card.classList.add("card-flipped");
      setTimeout(() => card.classList.remove("card-flipped"), 1200);
    };

    cards.forEach((coll, collIndex) => {
      coll.forEach((card, index) => {
        if (card.state === 1) {
          flipCards(index + collIndex * coll.length);
        } else if ([2, 3, 4, 5].includes(card.state)) {
          cardsLeft -= 1;
        }
      });
    });

    if (cardsLeft === 0) {
      setEndOfGame(true);
    } else {
      setEndOfGame(false);
    }
  }, [cards]);

  const updateOrientation = () => {
    // Checks if width is greater than height (landscape mode)
    if (window.innerWidth > window.innerHeight) {
      setIsLandscape(true);
    } else {
      setIsLandscape(false);
    }
  };

  useEffect(() => {
    updateOrientation();
    window.addEventListener("resize", updateOrientation);
    return () => {
      window.removeEventListener("resize", updateOrientation);
    };
  }, []);

  const rankedPlayers = endOfGame && room
    ? [...room.players].sort((first, second) => second.score - first.score)
    : [];
  const currentPlayerWon = rankedPlayers[0]?.name === name;

  return (
    <section className="App">
      <div>
        {!roomExists || users.length === 0 ? (
          <Loading />
        ) : (
          <>
            {/* Portrait Mode Warning */}
            {isLandscape ? (
              false
            ) : (
              <div className="portrait-warning">{t("game.rotate")}</div>
            )}

            {/* Ready button */}
            {isLandscape &&
            room.players.filter((user) => user.name === name).length > 0 &&
            room.players.filter((user) => user.ready).length !==
              room.players.length ? (
              <div className="portrait-warning online-ready">
                <p>
                  {t("online.players", {
                    ready: room.players.filter((user) => user.ready === true)
                      .length,
                    total: room.players.length,
                  })}
                </p>
                <button
                  onClick={() => {
                    if (
                      room.players.filter((user) => user.name === name)[0]
                        ?.ready
                    )
                      return;

                    socket.emit("user-connected", { id });
                  }}
                >
                  {t("online.ready")}
                </button>
              </div>
            ) : (
              false
            )}

            {/* Game Content */}
            <div className="online-container">
              <div>
                {users[0] ? (
                  <div
                    className="player-container"
                    style={{ border: "2px solid lightblue" }}
                  >
                    <img
                      src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonIdFromName(
                        users[0].name,
                      )}.png`}
                      alt={t("common.user")}
                      draggable={false}
                      style={{
                        outline:
                          users[0].name === room.playerTurn
                            ? "solid 1px lightgreen"
                            : "solid 1px transparent",
                      }}
                    />
                    <h6 className={users[0].skin} data-name={users[0].name}>
                      {users[0].name}
                    </h6>
                    <small
                      style={{
                        color: room.players[0].ready ? "lightgreen" : "unset",
                      }}
                    >
                      {t("online.pairsFound", {
                        count: room.players[0].score,
                      })}
                    </small>
                  </div>
                ) : (
                  false
                )}
                <br />
                {users[3] ? (
                  <div
                    className="player-container"
                    style={{ border: "2px solid burlywood" }}
                  >
                    <img
                      src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonIdFromName(
                        users[3].name,
                      )}.png`}
                      alt={t("common.user")}
                      draggable={false}
                      style={{
                        outline:
                          users[3].name === room.playerTurn
                            ? "solid 1px lightgreen"
                            : "solid 1px transparent",
                      }}
                    />
                    <h6 className={users[3].skin} data-name={users[3].name}>
                      {users[3].name}
                    </h6>
                    <small
                      style={{
                        color: room.players[3].ready ? "lightgreen" : "unset",
                      }}
                    >
                      {t("online.pairsFound", {
                        count: room.players[3].score,
                      })}
                    </small>
                  </div>
                ) : (
                  false
                )}
              </div>
              <div className="cards">
                <div className="cards-column">
                  {cards.map((row, index) => (
                    <div className="cards-row" key={index}>
                      {row.map((card, i) => (
                        <div
                          className={`card ${
                            [2, 3, 4, 5].includes(card.state)
                              ? "card-flipped"
                              : ""
                          }`}
                          data-pokemon={card.id}
                          key={index + "-" + i}
                          onClick={() => {
                            if (
                              flippedCards.length <= 1 &&
                              isLoggedIn &&
                              room.playerTurn === name &&
                              [0, 1].includes(card.state)
                            )
                              handleFlipCard(
                                index,
                                i,
                                i + index * row.length,
                              );
                          }}
                          style={{
                            border:
                              card.state === 2
                                ? "2px solid lightblue"
                                : card.state === 3
                                  ? "2px solid lightcoral"
                                  : card.state === 4
                                    ? "2px solid lightgreen"
                                    : card.state === 5
                                      ? "2px solid burlywood"
                                      : "none",
                          }}
                        >
                          <div className="card-front">
                            <img
                              src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png`}
                              alt={t("online.cardAlt", {
                                column: index,
                                row: i,
                              })}
                              draggable={false}
                            />
                          </div>
                          <div className="card-back">
                            <img
                              src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${
                                card.shiny ? "shiny/" : ""
                              }${card.id || 0}.png`}
                              alt={t("online.cardBackAlt", {
                                column: index,
                                row: i,
                              })}
                              draggable={false}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                {users[1] ? (
                  <div
                    className="player-container"
                    style={{ border: "2px solid lightcoral" }}
                  >
                    <img
                      src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonIdFromName(
                        users[1].name,
                      )}.png`}
                      alt={t("common.user")}
                      draggable={false}
                      style={{
                        outline:
                          users[1].name === room.playerTurn
                            ? "solid 1px lightgreen"
                            : "solid 1px transparent",
                      }}
                    />
                    <h6 className={users[1].skin} data-name={users[1].name}>
                      {users[1].name}
                    </h6>
                    <small
                      style={{
                        color: room.players[1].ready ? "lightgreen" : "unset",
                      }}
                    >
                      {t("online.pairsFound", {
                        count: room.players[1].score,
                      })}
                    </small>
                  </div>
                ) : (
                  false
                )}
                <br />
                {users[2] ? (
                  <div
                    className="player-container"
                    style={{ border: "2px solid lightgreen" }}
                  >
                    <img
                      src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonIdFromName(
                        users[2].name,
                      )}.png`}
                      alt={t("common.user")}
                      draggable={false}
                      style={{
                        outline:
                          users[2].name === room.playerTurn
                            ? "solid 1px lightgreen"
                            : "solid 1px transparent",
                      }}
                    />
                    <h6 className={users[2].skin} data-name={users[2].name}>
                      {users[2].name}
                    </h6>
                    <small
                      style={{
                        color: room.players[2].ready ? "lightgreen" : "unset",
                      }}
                    >
                      {t("online.pairsFound", {
                        count: room.players[2].score,
                      })}
                    </small>
                  </div>
                ) : (
                  false
                )}
              </div>
              {endOfGame ? (
                <GameResult
                  tone={currentPlayerWon ? "victory" : "defeat"}
                  eyebrow={t("online.resultEyebrow")}
                  title={t(currentPlayerWon ? "game.won" : "game.lost")}
                  description={t("online.resultSubtitle", {
                    count: rankedPlayers.length,
                  })}
                >
                  <ol
                    className="online-result-ranking"
                    data-player-count={rankedPlayers.length}
                  >
                    {rankedPlayers.map((player, playerIndex) => (
                      <li
                        className={player.name === name ? "current" : ""}
                        key={player.id || player.name}
                        aria-current={player.name === name ? "true" : undefined}
                      >
                        <span className="online-result-position">
                          #{playerIndex + 1}
                        </span>
                        <img
                          src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonIdFromName(
                            player.name,
                          )}.png`}
                          alt=""
                          draggable={false}
                        />
                        <strong
                          className={
                            users.find((user) => user.name === player.name)
                              ?.skin || "color-default"
                          }
                          data-name={player.name}
                        >
                          {player.name}
                        </strong>
                        <small>
                          {t("online.pairsFound", { count: player.score })}
                        </small>
                        <span className="online-result-status">
                          {playerIndex === 0 ? (
                            <>
                              <FaCrown /> {t("online.won")}
                            </>
                          ) : (
                            t("online.lost")
                          )}
                        </span>
                      </li>
                    ))}
                  </ol>
                </GameResult>
              ) : (
                false
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default Online;
