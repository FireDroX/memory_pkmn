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

    // Update user to be ready
    if (
      (name === json.room.player1.name && !json.room.player1.ready) ||
      (name === json.room.player2.name && !json.room.player2.ready)
    ) {
      socket.emit("user-connected", { name, id });
    }
  };

  const stringToDecimal = (str) => {
    let decimal = 0;
    str.split("").map((char) => (decimal += char.charCodeAt(0)));
    return ((decimal - 1) % 1025) + 1;
  };

  const handleFlipCard = (coll, row, index, isShiny) => {
    if (
      [2, 3].includes(cards[coll][row].state) ||
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
                  // Return a new object with state updated to 2 or 3
                  return { ...card, state: name === users[0] ? 2 : 3 };
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
        } else if ([2, 3].includes(card.state)) {
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

            {/* Game Content */}
            <div className="online-container">
              <div
                className="player1-container"
                style={{ border: "2px solid lightblue" }}
              >
                <img
                  src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${stringToDecimal(
                    users[0]
                  )}.png`}
                  alt="User"
                  draggable={false}
                  style={{
                    outline:
                      users[0] === room.playerTurn
                        ? "solid 1px lightgreen"
                        : "solid 1px transparent",
                  }}
                />
                <h6
                  style={{
                    color: room.player1.ready ? "lightgreen" : "unset",
                  }}
                >
                  {users[0]}
                </h6>
                <small>{room.player1.score} pairs found</small>
              </div>
              <div className="cards">
                <div className="cards-column">
                  {cards.map((row, index) => (
                    <div className="cards-row" key={index}>
                      {row.map((card, i) => (
                        <div
                          className={`card ${
                            [2, 3].includes(card.state) ? "card-flipped" : ""
                          }`}
                          data-pokemon={card.id}
                          key={index + "-" + i}
                          onClick={() => {
                            if (
                              flippedCards.length <= 1 &&
                              isLoggedIn &&
                              room.playerTurn === name &&
                              [0, 1].includes(card.state) &&
                              room.player1.ready &&
                              room.player2.ready
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
              <div
                className="player2-container"
                style={{ border: "2px solid lightcoral" }}
              >
                <img
                  src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${stringToDecimal(
                    users[1]
                  )}.png`}
                  alt="User"
                  draggable={false}
                  style={{
                    outline:
                      users[1] === room.playerTurn
                        ? "solid 1px lightgreen"
                        : "solid 1px transparent",
                  }}
                />
                <h6
                  style={{
                    color: room.player2.ready ? "lightgreen" : "unset",
                  }}
                >
                  {users[1]}
                </h6>
                <small>{room.player2.score} pairs found</small>
              </div>
              {endOfGame ? (
                <div className="online-ending">
                  {(() => {
                    const Winner = (first, second) => {
                      return (
                        <>
                          <div className="online-playerWon">
                            <img
                              src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${stringToDecimal(
                                users[first]
                              )}.png`}
                              alt="User"
                              draggable={false}
                            />
                            <h5>
                              WON <FaCrown />
                            </h5>
                          </div>
                          <div className="online-playerLost">
                            <img
                              src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${stringToDecimal(
                                users[second]
                              )}.png`}
                              alt="User"
                              draggable={false}
                            />
                            <h5>LOST</h5>
                          </div>
                        </>
                      );
                    };
                    if (room.player1.score > room.player2.score) {
                      return Winner(0, 1);
                    } else if (room.player2.score > room.player1.score) {
                      return Winner(1, 0);
                    } else {
                      return (
                        <>
                          <div className="online-playerWon">
                            <img
                              src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${stringToDecimal(
                                users[0]
                              )}.png`}
                              alt="User"
                              draggable={false}
                            />
                            <h5>
                              TIE <FaCrown />
                            </h5>
                          </div>
                          <div className="online-playerWon">
                            <img
                              src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${stringToDecimal(
                                users[1]
                              )}.png`}
                              alt="User"
                              draggable={false}
                            />
                            <h5>
                              TIE <FaCrown />
                            </h5>
                          </div>
                        </>
                      );
                    }
                  })()}
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
