import { useState, useEffect, useContext } from "react";
import { UserContext } from "../../../utils/UserContext";
import "./Solo.css";

const Solo = ({
  cards,
  setCards,
  tries,
  setTries,
  game,
  setGame,
  shinyMode,
}) => {
  const { name, isLoggedIn, setUserProfile } = useContext(UserContext);
  const [flippedCards, setFlippedCards] = useState([]);
  const [matchedCards, setMatchedCards] = useState([]);
  const [playerWon, setPlayerWon] = useState(false);
  const [playerLost, setPlayerLost] = useState(false);
  const [isLandscape, setIsLandscape] = useState(true);

  const handleFlipCard = (index) => {
    if (
      matchedCards.includes(index) ||
      flippedCards.some((c) => c.index === index)
    ) {
      // If the card is already matched or currently flipped, do nothing
      return;
    }

    const card = document.getElementsByClassName("card")[index];
    card.classList.add("card-flipped");
    const cardValue = Number(card.dataset.pokemon);

    const newFlippedCards = [...flippedCards, { index, cardValue }];
    setFlippedCards(() => {
      if (newFlippedCards.length === 2) {
        const [firstCard, secondCard] = newFlippedCards;

        if (firstCard.cardValue === secondCard.cardValue) {
          // It's a match, keep them flipped
          setTimeout(() => {
            document
              .getElementsByClassName("card")
              [firstCard.index].classList.add("card-found");
            document
              .getElementsByClassName("card")
              [secondCard.index].classList.add("card-found");
            setMatchedCards((prevMatched) => [
              ...prevMatched,
              firstCard.index,
              secondCard.index,
            ]);
            setGame((prevState) => ({
              ...prevState,
              pairs: prevState.pairs - 1,
            }));
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
            setGame((prevState) => ({
              ...prevState,
              tries: prevState.tries - 1,
            }));
          }, 1200);
        }
        return [];
      } else return newFlippedCards;
    });
  };

  const calculateXp = (tries, pairs) => {
    // Define parameters for adjustment
    const minOutput = 1;
    const maxOutput = 15;
    const minTries = 10;
    const maxTries = 100;
    const triesWeight = 2.5; // Increase to make tries have a stronger impact
    const pairsWeight = 2.0; // Reduce pairs weight slightly for a more subtle effect

    // Calculate base output with stronger impact from tries
    const baseValue =
      ((maxOutput - minOutput) / (maxTries - minTries)) *
        (maxTries / tries) *
        triesWeight +
      minOutput;
    const finalValue = baseValue * (pairs / 14) * pairsWeight;

    // Check if it's the weekend in Europe/Paris timezone
    const parisTime = new Date().toLocaleString("en-US", {
      timeZone: "Europe/Paris",
    });
    const parisDate = new Date(parisTime);
    const isWeekend = parisDate.getDay() === 6 || parisDate.getDay() === 0; // Saturday or Sunday

    // Ensure the final result is within the 1-25 range
    const roundedValue = Math.min(
      Math.max(Math.round(finalValue), minOutput),
      maxOutput
    );

    // Double XP on weekends
    return isWeekend ? roundedValue * 2 : roundedValue;
  };

  useEffect(() => {
    if (game.pairs === 0) {
      if (isLoggedIn) {
        const requestOptions = {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name,
            xp: calculateXp(tries, cards.flat().length / 2),
          }),
        };

        fetch("/update", requestOptions).then((data) => {
          if (data.status === 200) {
            data.json().then((json) => {
              setTimeout(() => setUserProfile(json.profile), 5000);
            });
          }
        });
      }
      setPlayerWon(true);
    }
    if (game.tries === 0) {
      setPlayerLost(true);
      const everyCards = document.getElementsByClassName("card");
      for (let i = 0; i < everyCards.length; i++) {
        const card = everyCards[i];
        setTimeout(() => {
          card.classList.add("card-flipped");
          if (!card.classList.contains("card-found")) {
            card.classList.add("card-not-found");
          }
        }, 50 * i);
      }
    }
  }, [game]);

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
    <>
      {/* Portrait Mode Warning */}
      {isLandscape ? (
        false
      ) : (
        <div className="portrait-warning">
          Please rotate your device to landscape mode for a better experience.
        </div>
      )}

      {/* Game Content */}
      <div className="cards">
        <div className="cards-column">
          {cards.map((row, index) => (
            <div className="cards-row" key={index}>
              {row.map((card, i) => (
                <div
                  className="card"
                  data-pokemon={card}
                  key={index + "-" + i}
                  onClick={() => {
                    if (
                      flippedCards.length <= 1 &&
                      !playerLost &&
                      !playerWon &&
                      game.started
                    )
                      handleFlipCard(i + index * row.length);
                  }}
                >
                  <div className="card-front">
                    <img
                      src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png`}
                      alt="Pokemon"
                      draggable={false}
                    />
                  </div>
                  <div className="card-back">
                    <img
                      src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${
                        shinyMode ? "shiny/" : ""
                      }${card || 0}.png`}
                      alt="Pokemon"
                      draggable={false}
                    />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
        <h6>
          {game.tries} TR{game.tries > 1 ? "IES" : "Y"} LEFT !
        </h6>
        {playerWon ? (
          <div className="chooseCards chooseCards-ending">
            <div className="chooseCards-select">
              <div className="chooseCards-title">
                <h5>You WON !</h5>
                <img
                  src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/67.png`}
                  alt="Machoke"
                  draggable={false}
                />
              </div>
              <div className="chooseCards-buttons">
                <small style={{ color: "var(--text)" }}>
                  With {game.tries} tr{game.tries > 1 ? "ies" : "y"} left !
                </small>
              </div>
            </div>
          </div>
        ) : playerLost ? (
          <div className="chooseCards chooseCards-ending">
            <div className="chooseCards-select">
              <div className="chooseCards-title">
                <h5>You lost...</h5>
                <img
                  src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/237.png`}
                  alt="Kapoera"
                  draggable={false}
                />
              </div>
              <div className="chooseCards-buttons">
                <small style={{ color: "var(--text)" }}>
                  There is {game.pairs} pair{game.pairs > 1 ? "s" : ""} left...
                </small>
              </div>
            </div>
          </div>
        ) : (
          false
        )}
      </div>
    </>
  );
};

export default Solo;
