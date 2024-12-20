import { useState, useLayoutEffect, useContext, useEffect } from "react";
import { FaCrown } from "react-icons/fa";
import { UserContext } from "../../../utils/UserContext";
import { socket } from "../../../socket";
import "../../../pages/Memory/Solo/Solo.css";
import "./Online.css";

import Loading from "../../../components/Loading/Loading";

const Online = ({ id }) => {
  const { name, isLoggedIn } = useContext(UserContext);
  const [roomExists, setRoomExists] = useState(true);
  const [users, setUsers] = useState([]);
  const [cards, setCards] = useState([]);
  const [flippedCards, setFlippedCards] = useState([]);
  const [room, setRoom] = useState();
  const [endOfGame, setEndOfGame] = useState(false);
  const [isLandscape, setIsLandscape] = useState(true);

  const postRoomValues = async (updatedCars, isPair, isPairShiny) => {
    socket.emit("update-room", {
      room: id,
      cards: updatedCars,
      player: name,
      pair: {
        isPair,
        shiny: isPairShiny,
      },
    });
  };

  const getRoomValues = async () => {
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ room: id }),
    };

    const data = await fetch("/rooms/get", requestOptions);
    if (data.status === 204) return setRoomExists(false);

    const json = await data.json();
    setUsers(json.users);
    setRoom(json.room);
    setCards(json.room.cards);
  };

  const stringToDecimal = (str) => {
    let decimal = 0;
    str.split("").map((char) => (decimal += char.charCodeAt(0)));
    return ((decimal - 1) % 1025) + 1;
  };

  const handleFlipCard = (coll, row, index, isShiny) => {
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
      { index, cardValue, coll, row, shiny: isShiny },
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
              })
            );
            setCards(updatedCards);
            postRoomValues(
              updatedCards,
              true,
              firstCard.shiny && secondCard.shiny ? true : false
            );
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
              })
            );
            setCards(updatedCards);
            postRoomValues(updatedCards, false, false);
          }, 1200);
        }
      }
      return newFlippedCards;
    });
  };

  useEffect(() => {
    socket.connect();
    socket.on("connection", getRoomValues());
    socket.on("refresh-room", (updatedRoomValues) => {
      setRoom(updatedRoomValues);
      setCards(updatedRoomValues.cards);
      setFlippedCards([]);
    });

    return () => {
      socket.disconnect();
      socket.off("connection");
      socket.off("refresh-room");
    };
  }, []);

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

    if (cardsLeft === 0) setEndOfGame(true);
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
              <div className="portrait-warning">
                Please rotate your device to landscape mode for a better
                experience.
              </div>
            )}

            {/* Ready button */}
            {isLandscape &&
            room.players.filter((user) => user.name === name).length > 0 &&
            room.players.filter((user) => user.ready).length !==
              room.players.length ? (
              <div className="portrait-warning online-ready">
                <p>
                  Players :{" "}
                  {room.players.filter((user) => user.ready === true).length}/
                  {room.players.length}
                </p>
                <button
                  onClick={() => {
                    if (
                      room.players.filter((user) => user.name === name)[0]
                        ?.ready
                    )
                      return;

                    socket.emit("user-connected", { name, id });
                  }}
                >
                  READY
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
                      src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${stringToDecimal(
                        users[0].name
                      )}.png`}
                      alt="User"
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
                      {room.players[0].score} pairs found
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
                      src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${stringToDecimal(
                        users[3].name
                      )}.png`}
                      alt="User"
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
                      {room.players[3].score} pairs found
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
                                card.shiny
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
                              alt={"Pokemon - " + index + "-" + i}
                              draggable={false}
                            />
                          </div>
                          <div className="card-back">
                            <img
                              src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${
                                card.shiny ? "shiny/" : ""
                              }${card.id || 0}.png`}
                              alt={"Pokemon Default - " + index + "-" + i}
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
                      src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${stringToDecimal(
                        users[1].name
                      )}.png`}
                      alt="User"
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
                      {room.players[1].score} pairs found
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
                      src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${stringToDecimal(
                        users[2].name
                      )}.png`}
                      alt="User"
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
                      {room.players[2].score} pairs found
                    </small>
                  </div>
                ) : (
                  false
                )}
              </div>
              {endOfGame ? (
                <div className="online-ending">
                  {room.players
                    .sort((a, b) => b.score - a.score)
                    .map((player, endIndex) => (
                      <>
                        <div
                          className={
                            endIndex === 0
                              ? "online-playerWon"
                              : "online-playerLost"
                          }
                        >
                          <img
                            src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${stringToDecimal(
                              player.name
                            )}.png`}
                            alt="User"
                            draggable={false}
                          />
                          <h5>
                            {endIndex === 0 ? (
                              <>
                                WON <FaCrown />
                              </>
                            ) : (
                              "LOST"
                            )}
                          </h5>
                        </div>
                      </>
                    ))}
                </div>
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
