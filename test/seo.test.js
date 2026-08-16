const test = require("node:test");
const assert = require("node:assert/strict");
const { readFile } = require("node:fs/promises");

test("les robots et le sitemap sont publies sans autoriser l'indexation", async () => {
  const [robots, sitemap, index] = await Promise.all([
    readFile("client/public/robots.txt", "utf8"),
    readFile("client/public/sitemap.xml", "utf8"),
    readFile("client/index.html", "utf8"),
  ]);

  assert.match(robots, /User-agent:\s*\*/i);
  assert.match(robots, /Allow:\s*\//i);
  assert.match(robots, /Sitemap:\s*https:\/\/pokeflip\.addrien\.fr\/sitemap\.xml/i);
  assert.match(sitemap, /<loc>https:\/\/pokeflip\.addrien\.fr\/<\/loc>/i);
  assert.match(index, /<meta\s+name="robots"\s+content="noindex, nofollow, noarchive, nosnippet, noimageindex"\s*\/>/i);
});

test("toutes les reponses HTTP demandent aux moteurs de ne pas indexer", () => {
  const noIndex = require("../server/noIndex");
  const headers = {};
  const response = {
    set(name, value) {
      headers[name] = value;
    },
  };
  let nextCalled = false;

  noIndex({}, response, () => {
    nextCalled = true;
  });

  assert.equal(
    headers["X-Robots-Tag"],
    "noindex, nofollow, noarchive, nosnippet, noimageindex",
  );
  assert.equal(nextCalled, true);
});
