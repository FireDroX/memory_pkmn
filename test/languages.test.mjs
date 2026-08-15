import test from "node:test";
import assert from "node:assert/strict";
import {
  defaultLanguage,
  getLanguage,
} from "../client/src/utils/languages.js";

test("le francais est la langue par defaut et chaque langue pointe vers l'autre", () => {
  assert.equal(defaultLanguage, "fr");
  assert.equal(getLanguage(undefined).code, "fr");
  assert.equal(getLanguage("fr-FR").alternate, "en");
  assert.equal(getLanguage("en-US").alternate, "fr");
});
