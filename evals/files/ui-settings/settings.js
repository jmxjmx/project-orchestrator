function normalizeTheme(value) {
  return ["light", "dark", "system"].includes(value) ? value : "system";
}

module.exports = { normalizeTheme };
