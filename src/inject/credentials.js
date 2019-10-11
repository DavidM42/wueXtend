// TODO fix this and import into files instead of duplicates, don't know how to import
function saveSettings(usernameIn,passwordIn) {
    browser.storage.local.set({
        username: usernameIn,
        password: passwordIn,
    })
}

export { saveSettings };