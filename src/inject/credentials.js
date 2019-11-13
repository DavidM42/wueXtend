// TODO fix this and import into files instead of duplicates, don't know how to import
const saveSettings = (usernameIn,passwordIn) => {
    browser.storage.local.set({
        username: usernameIn.toLowerCase(),
        password: passwordIn,
    })
}

export { saveSettings };