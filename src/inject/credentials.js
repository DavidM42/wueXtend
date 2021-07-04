function saveSettings(usernameIn, passwordIn) {
  browser.storage.local.set({
    username: usernameIn.toLowerCase(),
    password: passwordIn,
    // opt in cause important feature
    autoLogin: true
  });
};