function loginForm(username, password) {
    const loginClassElements = document.getElementsByClassName('input_login_hisinone');

    if (loginClassElements.length > 0) {
        console.log("You are not logged in")

        const error_infoboxes = document.getElementsByClassName('error_infobox');
        if (error_infoboxes.length === 0) {
            console.log('Will log in now');
            // filling out info not using ids cause seem randomized TODO maybe not language change safe
            for (let i = 0; i < loginClassElements.length; i++) {
                const element = loginClassElements[i];
                const title = element.title.toLowerCase()
                if (title.includes('benutzername') || title.includes('user name')) {
                    element.value = username;
                } else if (title.includes('passwor')) { //works for both language cases passwort and password
                    element.value = password;
                }
            }

            const loginButton = document.getElementById('loginForm:login');
            loginButton.click();
        } else {
            console.log('Login failed previously');
            alert('Login failed. Check credentials in addon settings')
        }
    }
}

// TODO write central js file for getting credentials from storage to use in this and wuestudy
function onCredsGot(credsObj) {
    const username = credsObj.username;
    const password = credsObj.password;
    loginForm(username, password);
}

function onError(error) {
    console.log(`Error: ${error}`);
}
// TODO //////////77

browser.extension.sendMessage({}, function (response) {
    var readyStateCheckInterval = setInterval(function () {
        if (document.readyState === "complete") {
            clearInterval(readyStateCheckInterval);

            // handle login if not logged in
            // would like sync storagearea not local but android firefox does not support I think
            // need storage permission
            const getPromise = browser.storage.local.get(['username', 'password']);
            getPromise.then(onCredsGot, onError);

        }
    }, 10);
});