const shuffle = (items) => {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [items[index], items[target]] = [items[target], items[index]];
  }
  return items;
};

export const shuffleWithoutAdjacentPairs = (items, columns, rows) => {
  for (let attempt = 0; attempt < 1000; attempt += 1) {
    const shuffled = shuffle([...items]);
    let valid = true;
    for (let index = 0; index < shuffled.length; index += 1) {
      const column = Math.floor(index / rows);
      const row = index % rows;
      const neighbors = [[column - 1, row], [column + 1, row], [column, row - 1], [column, row + 1]];
      if (neighbors.some(([neighborColumn, neighborRow]) =>
        neighborColumn >= 0 && neighborColumn < columns &&
        neighborRow >= 0 && neighborRow < rows &&
        shuffled[index] === shuffled[neighborColumn * rows + neighborRow]
      )) {
        valid = false;
        break;
      }
    }
    if (valid) return shuffled;
  }
  return shuffle([...items]);
};
