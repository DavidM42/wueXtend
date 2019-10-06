// import { saveSettings } from '../credentials.js';
function saveSettings(usernameIn,passwordIn) {
    browser.storage.local.set({
        username: usernameIn,
        password: passwordIn,
    })
}


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

function ripPasswordsFromForm() {
    let username = null;
    let password = null;

    // TODO do this loop only once not two times in one file
    const loginClassElements = document.getElementsByClassName('input_login_hisinone');
    if (loginClassElements.length > 0) {
        const error_infoboxes = document.getElementsByClassName('error_infobox');
        if (error_infoboxes.length === 0) {
            for (let i = 0; i < loginClassElements.length; i++) {
                const element = loginClassElements[i];
                const title = element.title.toLowerCase()
                if (title.includes('benutzername') || title.includes('user name')) {
                    username = element.value;
                } else if (title.includes('passwor')) { //works for both language cases passwort and password
                    password = element.value;
                }
            }
        }
    }

    if (username !== null && password !== null) {
        console.log('Will save settings received from form')
        saveSettings(username,password);
    }
}


// TODO write central js file for getting credentials from storage to use in this and wuestudy
function onCredsGot(credsObj) {
    const username = credsObj.username;
    const password = credsObj.password;

	if (username === undefined || password === undefined) {
        // if no username password were set get the ones entered on first login onclick of loginBtn
        // TODO catch case where loginButton null
        const loginButton = document.getElementById('loginForm:login');
        loginButton.onclick = ripPasswordsFromForm;
	} else {
        // auto login if creds were set
        loginForm(username, password);
    }

}

function onError(error) {
    console.log(`Error: ${error}`);
}
// TODO //////////

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