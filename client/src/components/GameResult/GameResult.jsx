import "./GameResult.css";

const GameResult = ({
  tone,
  eyebrow,
  title,
  description,
  image,
  imageAlt,
  children,
}) => (
  <div className="game-result-overlay">
    <section
      className={`game-result game-result--${tone} ${image ? "game-result--solo" : "game-result--ranking"}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-result-title"
    >
      <span className="game-result__eyebrow">{eyebrow}</span>
      <div
        className={`game-result__hero ${image ? "" : "game-result__hero--centered"}`}
      >
        {image && (
          <div className="game-result__mascot">
            <span aria-hidden="true" />
            <img src={image} alt={imageAlt} draggable={false} />
          </div>
        )}
        <div className="game-result__copy">
          <h2 id="game-result-title">{title}</h2>
          <p>{description}</p>
        </div>
      </div>
      {children}
    </section>
  </div>
);

export default GameResult;
