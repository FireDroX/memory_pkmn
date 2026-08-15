export const pokemonIdFromName = (name) => {
  const characterTotal = [...name].reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  );
  return ((characterTotal - 1) % 1025) + 1;
};
