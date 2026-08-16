const shuffle = (items) => {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [items[index], items[target]] = [items[target], items[index]];
  }
  return items;
};

const createCards = (columns, rows) => {
  const pairCount = (columns * rows) / 2;
  const usedNumbers = new Set();
  const pairs = [];

  while (pairs.length < pairCount * 2) {
    const id = Math.floor(Math.random() * 1025) + 1;
    if (usedNumbers.has(id)) continue;

    usedNumbers.add(id);
    const shiny = Math.floor(Math.random() * 8192) === 0;
    pairs.push({ id, shiny }, { id, shiny });
  }

  const cards = shuffle(pairs);
  return Array.from({ length: columns }, (_, columnIndex) =>
    Array.from({ length: rows }, (_, rowIndex) => ({
      ...cards[columnIndex * rows + rowIndex],
      state: 0,
    })),
  );
};

module.exports = { createCards };
