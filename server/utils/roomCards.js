const shuffle = (items) => {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [items[index], items[target]] = [items[target], items[index]];
  }
  return items;
};

const shuffleWithoutAdjacentPairs = (items, columns, rows) => {
  for (let attempt = 0; attempt < 1000; attempt += 1) {
    const shuffled = shuffle([...items]);
    let valid = true;
    for (let index = 0; index < shuffled.length; index += 1) {
      const x = Math.floor(index / rows);
      const y = index % rows;
      const neighbors = [
        [x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1],
      ];
      for (const [neighborX, neighborY] of neighbors) {
        if (
          neighborX >= 0 && neighborX < columns &&
          neighborY >= 0 && neighborY < rows &&
          shuffled[index].id === shuffled[neighborX * rows + neighborY].id
        ) valid = false;
      }
      if (!valid) break;
    }
    if (valid) return shuffled;
  }
  return shuffle([...items]);
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

  const cards = shuffleWithoutAdjacentPairs(pairs, columns, rows);
  return Array.from({ length: columns }, (_, columnIndex) =>
    Array.from({ length: rows }, (_, rowIndex) => ({
      ...cards[columnIndex * rows + rowIndex],
      state: 0,
    })),
  );
};

module.exports = { createCards, shuffleWithoutAdjacentPairs };
