import { useState } from "react";
import Solo from "../Memory/Solo/Solo";
import "./Home.css";

function Home() {
  const [cards, setCards] = useState([]);
  const [tries, setTries] = useState(20);
  const [game, setGame] = useState({ pairs: -1, tries: -1, started: false });
  const [shinyMode, setShinyMode] = useState(false);

  const parisTime = new Date().toLocaleString("en-US", {
    timeZone: "Europe/Paris",
  });
  const parisDate = new Date(parisTime);
  const isWeekend = parisDate.getDay() === 6 || parisDate.getDay() === 0;

  const shuffleArray = (array) => {
    for (let index = array.length - 1; index > 0; index -= 1) {
      const target = Math.floor(Math.random() * (index + 1));
      [array[index], array[target]] = [array[target], array[index]];
    }
    return array;
  };

  const setDefaultCards = (columns, rows) => {
    const pairCount = (columns * rows) / 2;
    const usedNumbers = new Set();
    const pairs = [];

    while (pairs.length < pairCount * 2) {
      const id = Math.floor(Math.random() * 1025) + 1;
      if (!usedNumbers.has(id)) {
        usedNumbers.add(id);
        pairs.push(id, id);
      }
    }

    const shuffledCards = shuffleArray(pairs);
    setCards(
      Array.from({ length: columns }, (_, columnIndex) =>
        Array.from(
          { length: rows },
          (_, rowIndex) => shuffledCards[columnIndex * rows + rowIndex],
        ),
      ),
    );

    setTimeout(() => {
      const everyCards = document.getElementsByClassName("card");
      for (let index = 0; index < everyCards.length; index += 1) {
        const card = everyCards[index];
        setTimeout(() => {
          card.classList.add("card-flipped");
          setTimeout(() => {
            card.classList.remove("card-flipped");
            if (index === everyCards.length - 1) {
              setGame((previous) => ({ ...previous, started: true }));
            }
          }, 8000);
        }, 50 * index);
      }
    }, 1000);

    setGame((previous) => ({
      ...previous,
      pairs: pairCount,
      tries,
    }));
  };

  return (
    <section className="App home-page">
      <div className="page-shell">
        {cards.length === 0 ? (
          <div className="chooseCards">
            <div className="chooseCards-select">
              <div className="chooseCards-title">
                <span className="eyebrow">MEMORY BATTLE</span>
                <h1>
                  RETOURNE.
                  <br />
                  MEMORISE.
                  <br />
                  <em>GAGNE.</em>
                </h1>
                <p>
                  Retrouve les paires de Pokemon avant la fin de tes essais.
                  Chaque partie genere une nouvelle arene.
                </p>
                <div className="home-badges">
                  <span>1025 Pokemon</span>
                  <span>Mode shiny</span>
                  <span>Temps reel</span>
                </div>
              </div>

              <div className="home-mascot">
                <span className="mascot-ring" aria-hidden="true" />
                <img
                  src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${
                    shinyMode ? "shiny/" : ""
                  }6.png`}
                  alt="Dracaufeu"
                  onClick={() => setShinyMode((previous) => !previous)}
                  draggable={false}
                />
                <button onClick={() => setShinyMode((previous) => !previous)}>
                  {shinyMode ? "Shiny active" : "Mode shiny"}
                </button>
              </div>
            </div>

            <div className="game-config-panel">
              <div className="config-heading">
                <span className="config-step">01</span>
                <div>
                  <strong>Choisis ton arene</strong>
                  <small>Plus la grille est grande, plus le defi monte.</small>
                </div>
              </div>
              <div className="chooseCards-buttons">
                {[
                  { pairs: 14, rows: 7, label: "Debutant" },
                  { pairs: 18, rows: 9, label: "Confirme" },
                  { pairs: 22, rows: 11, label: "Expert" },
                ].map((option) => (
                  <button
                    key={option.pairs}
                    onClick={() => setDefaultCards(4, option.rows)}
                  >
                    <strong>{option.pairs}</strong>
                    <span>paires</span>
                    <small>{option.label}</small>
                  </button>
                ))}
              </div>

              <div className="chooseCards-config">
                <div className="config-heading">
                  <span className="config-step">02</span>
                  <div>
                    <strong>Regle tes essais</strong>
                    <small>Moins d'essais, plus de tension.</small>
                  </div>
                  <output>{tries}</output>
                </div>
                <div className="chooseCards-selector">
                  <span>Hard</span>
                  <input
                    type="range"
                    name="Tries"
                    min={10}
                    max={100}
                    value={tries}
                    onChange={(event) => setTries(Number(event.target.value))}
                    className="chooseCards-slider"
                  />
                  <span>Easy</span>
                </div>
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

      <footer className="site-footer">
        <span>
          <a href="https://pokeapi.co/" target="_blank" rel="noreferrer">
            PokeAPI
          </a>
          <a href="/api/mentions-legales" target="_blank" rel="noreferrer">
            Mentions legales
          </a>
        </span>
        <span>
          {isWeekend
            ? "Double XP ce week-end !"
            : "Attrape-les tous, deux par deux."}
        </span>
      </footer>
    </section>
  );
}

export default Home;
