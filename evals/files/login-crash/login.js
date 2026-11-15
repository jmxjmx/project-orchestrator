function validatePassword(password) {
  if (password.trim().length === 0) {
    throw new Error("Password must not be empty");
  }
  return true;
}

module.exports = { validatePassword };
