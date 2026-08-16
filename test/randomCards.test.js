const test = require("node:test");
const assert = require("node:assert/strict");
const { createCards } = require("../server/utils/roomCards");

test("les cartes generees n'ont pas de paire directement adjacente", () => {
  for (let sample = 0; sample < 100; sample += 1) {
    const cards = createCards(4, 11);
    const rows = cards[0].length;
    cards.forEach((column, columnIndex) => column.forEach((card, rowIndex) => {
      [[columnIndex + 1, rowIndex], [columnIndex, rowIndex + 1]].forEach(([nextColumn, nextRow]) => {
        if (nextColumn < cards.length && nextRow < rows) {
          assert.notEqual(card.id, cards[nextColumn][nextRow].id);
        }
      });
    }));
  }
});
