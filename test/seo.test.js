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

test("la carte Open Graph expose une image sociale complete", async () => {
  const [index, image] = await Promise.all([
    readFile("client/index.html", "utf8"),
    readFile("client/public/og-card.png"),
  ]);

  assert.match(index, /property="og:title" content="PokeFlip — Memory Battle"/);
  assert.match(index, /property="og:image" content="https:\/\/pokeflip\.addrien\.fr\/og-card\.png"/);
  assert.match(index, /property="og:image:width" content="1200"/);
  assert.match(index, /property="og:image:height" content="630"/);
  assert.match(index, /name="twitter:card" content="summary_large_image"/);
  assert.match(index, /rel="canonical" href="https:\/\/pokeflip\.addrien\.fr\/"/);
  assert.equal(image.readUInt32BE(16), 1200);
  assert.equal(image.readUInt32BE(20), 630);
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
