const { validatePassword } = require("./login.js");

try {
  validatePassword("");
  console.log("PASS: empty password is handled without throwing");
} catch (error) {
  console.error(`FAIL: ${error.message}`);
  process.exitCode = 1;
}
