import { useState } from "react";
import "./Home.css";

import Solo from "../Memory/Solo/Solo";

function Home() {
  const [cards, setCards] = useState([]);
  const [tries, setTries] = useState(20);
  const [game, setGame] = useState({ pairs: -1, tries: -1, started: false });
  const [shinyMode, setShinyMode] = useState(false);

  // Check if it's the weekend in Europe/Paris timezone
  const parisTime = new Date().toLocaleString("en-US", {
    timeZone: "Europe/Paris",
  });
  const parisDate = new Date(parisTime);
  const isWeekend = parisDate.getDay() === 6 || parisDate.getDay() === 0; // Saturday or Sunday

  const shuffleArray = (array) => {
    // Fisher-Yates shuffle algorithm to shuffle an array
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const setDefaultCards = (columns, rows) => {
    const nbOfPairs = (columns * rows) / 2;

    // Create a Set to keep track of the numbers that have already been used
    const usedNumbers = new Set();

    // Generate unique pairs of random numbers between 1 and 1025
    const randomPairs = [];
    while (randomPairs.length < nbOfPairs * 2) {
      let randomNum = Math.floor(Math.random() * 1025) + 1;

      // If the number is already used, generate another one
      if (!usedNumbers.has(randomNum)) {
        usedNumbers.add(randomNum);
        randomPairs.push(randomNum, randomNum); // Add the number twice for pairing
      }
    }

    // Shuffle the pairs randomly
    const shuffledCards = shuffleArray(randomPairs);

    // Create a 2D array (grid) with the shuffled cards
    const array = Array.from({ length: columns }, (_, columnIndex) =>
      Array.from({ length: rows }, (_, rowIndex) => {
        const flatIndex = columnIndex * rows + rowIndex;
        return shuffledCards[flatIndex];
      })
    );
    setCards(array);

    setTimeout(() => {
      // Flip the cards to show them
      const everyCards = document.getElementsByClassName("card");
      for (let i = 0; i < everyCards.length; i++) {
        const card = everyCards[i];
        setTimeout(() => {
          card.classList.add("card-flipped");
          setTimeout(() => {
            card.classList.remove("card-flipped");
            if (i === everyCards.length - 1)
              setGame((prevState) => ({
                ...prevState,
                started: true,
              }));
          }, 8000);
        }, 50 * i);
      }
    }, 1000);
    setGame((prevState) => ({
      ...prevState,
      pairs: (columns * rows) / 2,
      tries: tries,
    }));
  };

  return (
    <section className="App">
      <div>
        {cards.length === 0 ? (
          <div className="chooseCards">
            <div className="chooseCards-select">
              <div className="chooseCards-title">
                <h4>PokeFlip Online</h4>
                <img
                  src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${
                    shinyMode ? "shiny/" : ""
                  }6.png`}
                  alt="Charmander"
                  onClick={() => setShinyMode((prev) => !prev)}
                  draggable={false}
                />
              </div>
              <div className="chooseCards-buttons">
                <button onClick={() => setDefaultCards(4, 7)}>14 Pairs</button>
                <button onClick={() => setDefaultCards(4, 9)}>18 Pairs</button>
                <button onClick={() => setDefaultCards(4, 11)}>22 Pairs</button>
              </div>
            </div>
            <div className="chooseCards-config">
              <small>Amount of tries : {tries}</small>
              <div className="chooseCards-selector">
                <h6>HARD</h6>
                <input
                  type="range"
                  name="Tries"
                  min={10}
                  max={100}
                  value={tries}
                  onChange={(e) => setTries(Number(e.target.value))}
                  className="chooseCards-slider"
                />
                <h6>EASY</h6>
              </div>
            </div>
          </div>
        ) : (
          <Solo
            cards={cards}
            game={game}
            setCards={setCards}
            tries={tries}
            setTries={setTries}
            setGame={setGame}
            shinyMode={shinyMode}
          />
        )}
      </div>
      <a
        href="https://pokeapi.co/"
        target="_blank"
        style={{
          position: "absolute",
          bottom: 5,
          left: 10,
          color: "var(--text15)",
        }}
      >
        PokeAPI
      </a>
      {isWeekend ? (
        <span
          style={{
            position: "absolute",
            bottom: 5,
            right: 10,
            color: "var(--text15)",
          }}
        >
          DOUBLE XP WEEK-END !
        </span>
      ) : (
        false
      )}
    </section>
  );
}

export default Home;
