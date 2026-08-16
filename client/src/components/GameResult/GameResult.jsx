import "./GameResult.css";
import { useEffect, useRef } from "react";

const GameResult = ({
  tone,
  eyebrow,
  title,
  description,
  image,
  imageAlt,
  children,
  actions,
}) => {
  const dialogRef = useRef(null);
  useEffect(() => {
    const previousFocus = document.activeElement;
    const dialog = dialogRef.current;
    const getButtons = () => [...(dialog?.querySelectorAll("button") || [])];
    const firstButton = getButtons()[0];
    firstButton?.focus();
    const trapFocus = (event) => {
      if (event.key !== "Tab") return;
      const buttons = getButtons();
      if (!buttons.length) return;
      const currentIndex = buttons.indexOf(document.activeElement);
      const nextIndex = event.shiftKey
        ? (currentIndex - 1 + buttons.length) % buttons.length
        : (currentIndex + 1) % buttons.length;
      event.preventDefault();
      buttons[nextIndex].focus();
    };
    dialog?.addEventListener("keydown", trapFocus);
    return () => {
      dialog?.removeEventListener("keydown", trapFocus);
      previousFocus?.focus?.();
    };
  }, []);
  return <div className="game-result-overlay">
    <section
      ref={dialogRef}
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
      {actions && <div className="game-result__actions">{actions}</div>}
    </section>
  </div>;
};

export default GameResult;
