const test = require("node:test");
const assert = require("node:assert/strict");
const validateCardUpdate = require("../server/socket/validateCardUpdate");

const board = () => [
  [
    { id: 25, shiny: false, state: 0 },
    { id: 7, shiny: true, state: 0 },
  ],
  [
    { id: 25, shiny: false, state: 0 },
    { id: 7, shiny: true, state: 0 },
  ],
];

test("le serveur deduit une paire depuis les cartes de la room", () => {
  const previous = board();
  const next = board();
  next[0][0].state = 2;
  next[1][0].state = 2;

  assert.deepEqual(validateCardUpdate(previous, next, 2), {
    isPair: true,
    pokemon: 25,
    shiny: false,
  });
});

test("le serveur deduit un essai rate depuis deux cartes distinctes", () => {
  const previous = board();
  const next = board();
  next[0][0].state = 1;
  next[0][1].state = 1;

  assert.deepEqual(validateCardUpdate(previous, next, 2), {
    isPair: false,
    pokemon: null,
    shiny: false,
  });
});

test("le serveur refuse les recompenses et cartes inventees par le client", () => {
  const previous = board();

  const wrongPair = board();
  wrongPair[0][0].state = 2;
  wrongPair[0][1].state = 2;
  assert.equal(validateCardUpdate(previous, wrongPair, 2), null);

  const changedPokemon = board();
  changedPokemon[0][0].id = 644;
  changedPokemon[0][0].state = 2;
  changedPokemon[1][0].state = 2;
  assert.equal(validateCardUpdate(previous, changedPokemon, 2), null);

  const claimedForAnotherPlayer = board();
  claimedForAnotherPlayer[0][0].state = 3;
  claimedForAnotherPlayer[1][0].state = 3;
  assert.equal(validateCardUpdate(previous, claimedForAnotherPlayer, 2), null);
});

test("le serveur conserve les paires deja trouvees", () => {
  const previous = board();
  previous[0][0].state = 3;
  previous[1][0].state = 3;
  const next = structuredClone(previous);
  next[0][1].state = 2;
  next[1][1].state = 2;

  assert.deepEqual(validateCardUpdate(previous, next, 2), {
    isPair: true,
    pokemon: 7,
    shiny: true,
  });
});
