const assert = require("node:assert/strict");
const { normalizeTheme } = require("./settings.js");

assert.equal(normalizeTheme("dark"), "dark");
assert.equal(normalizeTheme("invalid"), "system");
console.log("Unit tests passed");
