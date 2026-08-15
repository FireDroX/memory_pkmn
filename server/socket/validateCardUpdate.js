const matchedStates = new Set([2, 3, 4, 5]);
const hiddenStates = new Set([0, 1]);

const flattenBoard = (board) => {
  if (!Array.isArray(board) || board.length === 0) return null;

  const cards = [];
  for (let column = 0; column < board.length; column += 1) {
    if (!Array.isArray(board[column]) || board[column].length === 0) {
      return null;
    }
    for (let row = 0; row < board[column].length; row += 1) {
      cards.push({ card: board[column][row], column, row });
    }
  }
  return cards;
};

const validateCardUpdate = (previousBoard, nextBoard, playerState) => {
  if (!matchedStates.has(playerState)) return null;

  const previousCards = flattenBoard(previousBoard);
  const nextCards = flattenBoard(nextBoard);
  if (!previousCards || !nextCards || previousCards.length !== nextCards.length) {
    return null;
  }

  const newlyMatched = [];
  const visibleHiddenCards = [];

  for (let index = 0; index < previousCards.length; index += 1) {
    const previousPosition = previousCards[index];
    const nextPosition = nextCards[index];
    const previous = previousPosition.card;
    const next = nextPosition.card;

    if (
      previousPosition.column !== nextPosition.column ||
      previousPosition.row !== nextPosition.row ||
      !previous ||
      !next ||
      previous.id !== next.id ||
      Boolean(previous.shiny) !== Boolean(next.shiny)
    ) {
      return null;
    }

    if (matchedStates.has(previous.state)) {
      if (next.state !== previous.state) return null;
      continue;
    }

    if (!hiddenStates.has(previous.state)) return null;
    if (next.state === playerState) {
      newlyMatched.push(next);
      continue;
    }
    if (!hiddenStates.has(next.state)) return null;
    if (next.state === 1) visibleHiddenCards.push(next);
  }

  if (newlyMatched.length === 2) {
    if (visibleHiddenCards.length !== 0) return null;
    if (newlyMatched[0].id !== newlyMatched[1].id) return null;
    return {
      isPair: true,
      pokemon: Number(newlyMatched[0].id),
      shiny: newlyMatched.every((card) => Boolean(card.shiny)),
    };
  }

  if (newlyMatched.length !== 0 || visibleHiddenCards.length !== 2) {
    return null;
  }
  if (visibleHiddenCards[0].id === visibleHiddenCards[1].id) return null;

  return { isPair: false, pokemon: null, shiny: false };
};

module.exports = validateCardUpdate;
