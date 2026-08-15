import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";

const flattenKeys = (value, prefix = "") =>
  Object.entries(value).flatMap(([key, entry]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return entry && typeof entry === "object"
      ? flattenKeys(entry, path)
      : [path];
  });

const readCatalog = async (language) =>
  JSON.parse(
    await readFile(
      new URL(`../client/src/locales/${language}.json`, import.meta.url),
      "utf8",
    ),
  );

test("les catalogues francais et anglais possedent les memes cles", async () => {
  const [fr, en] = await Promise.all(["fr", "en"].map(readCatalog));

  assert.deepEqual(flattenKeys(fr).sort(), flattenKeys(en).sort());
});

const findSourceFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map(async (entry) => {
        const path = `${directory}/${entry.name}`;
        if (entry.isDirectory()) return findSourceFiles(path);
        return /\.(js|jsx)$/.test(entry.name) ? [path] : [];
      }),
    )
  ).flat();
};

test("chaque cle i18n statique utilisee par React existe", async () => {
  const fr = await readCatalog("fr");
  const availableKeys = new Set(flattenKeys(fr));
  const sourceRoot = new URL("../client/src", import.meta.url).pathname.replace(
    /^\/(.:\/)/,
    "$1",
  );
  const files = await findSourceFiles(sourceRoot);
  const usedKeys = new Set();

  for (const file of files) {
    const source = await readFile(file, "utf8");
    for (const match of source.matchAll(/\bt\(\s*["']([^"']+)["']/g)) {
      usedKeys.add(match[1]);
    }
  }

  const missingKeys = [...usedKeys].filter(
    (key) =>
      !availableKeys.has(key) &&
      !availableKeys.has(`${key}_one`) &&
      !availableKeys.has(`${key}_other`),
  );
  assert.deepEqual(missingKeys, []);
});
