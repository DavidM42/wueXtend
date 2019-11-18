// eslint-disable-next-line no-undef
const browserPolyFill = browser;

// import { saveSettings } from '../credentials.js';
const saveSettings = (usernameIn,passwordIn) => {
    browserPolyFill.storage.local.set({
        username: usernameIn.toLowerCase(),
        password: passwordIn,
        // TODO opt in or optout?
        autoLogin: true
    });
};


const loginForm = (username, password) => {
    // TODO why is this needed why does username keeps getting uppercase
    if (username[0] === 'S'){
        username = username.toLowerCase();
    }

    const loginClassElements = document.getElementsByClassName('input_login_hisinone');

    // login Form if you try to access reserved site without beeing logged in
    const loginForm = document.getElementById('login');
    const loginFormInputs = document.getElementsByClassName('input_login');

    if (loginForm || loginClassElements.length > 0) {
        console.log('You are not logged in');

        const error_infoboxes = document.getElementsByClassName('error_infobox');
        if (error_infoboxes.length === 0) {

            // if loginForm on page exists use this for premium login with redirect
            if (loginForm) {
                console.log('Will log in now and redirect');
                // filling out info not using ids cause seem randomized
                for (let i = 0; i < loginFormInputs.length; i++) {
                    const element = loginFormInputs[i];

                    const type = element.type;
                    if (type === 'text') {
                        element.value = username;
                    } else if (type === 'password') {
                        element.value = password;
                    }
                }

                // TODO refactor if and else for two login strategies here to reduce code repetition
                const loginButton = document.getElementsByClassName('submit_highlighted')[0];
                loginButton.click();
            } else {
                console.log('Will log in now and go to main page');
                // else fallback to top of page which redirects to index site
                // filling out info not using ids cause seem randomized TODO maybe not language change safe
                for (let i = 0; i < loginClassElements.length; i++) {
                    const element = loginClassElements[i];
                    const title = element.title.toLowerCase();
                    if (title.includes('benutzername') || title.includes('user name')) {
                        element.value = username;
                    } else if (title.includes('passwor')) { //works for both language cases passwort and password
                        element.value = password;
                    }
                }
                let loginButton = document.getElementById('loginForm:login');
                if (!loginButton) {
                    // other class name on mobile site
                    loginButton = document.getElementsByClassName('mobileLoginButton')[0];
                }
                loginButton.click();
            }


        } else {
            console.log('Login failed previously');
            alert('Login failed. Check credentials in addon settings');
        }
    }
};

const ripPasswordsFromForm = () => {
    let username = null;
    let password = null;

    // TODO do this loop only once not two times in one file
    const loginClassElements = document.getElementsByClassName('input_login_hisinone');
    if (loginClassElements.length > 0) {
        const error_infoboxes = document.getElementsByClassName('error_infobox');
        if (error_infoboxes.length === 0) {
            for (let i = 0; i < loginClassElements.length; i++) {
                const element = loginClassElements[i];
                const title = element.title.toLowerCase();
                if (title.includes('benutzername') || title.includes('user name')) {
                    username = element.value;
                } else if (title.includes('passwor')) { //works for both language cases passwort and password
                    password = element.value;
                }
            }
        }
    }

    if (username !== null && password !== null) {
        console.log('Will save settings received from form');
        saveSettings(username,password);
    }
};


// TODO write central js file for getting credentials from storage to use in this and wuestudy
const onCredsGot = (credsObj) => {
    const username = credsObj.username;
    const password = credsObj.password;
    const autoLogin = credsObj.autoLogin;

    if (username === undefined || password === undefined) {
        // if no username password were set get the ones entered on first login onclick of loginBtn
        // TODO catch case where loginButton null
        const loginButton = document.getElementById('loginForm:login');
        loginButton.onclick = ripPasswordsFromForm;
    } else {
        // auto login turn of setting
        if (autoLogin !== false){
            // auto login if creds were set
            loginForm(username, password);
        }
    }

};

const onError = (error) => {
    console.log(`Error: ${error}`);
};
// TODO //////////

browserPolyFill.runtime.sendMessage({},() => {
    var readyStateCheckInterval = setInterval(() => {
        if (document.readyState === 'complete') {
            clearInterval(readyStateCheckInterval);

            // handle login if not logged in
            // would like sync storagearea not local but android firefox does not support I think
            // need storage permission
            const getPromise = browserPolyFill.storage.local.get(['username', 'password', 'autoLogin']);
            getPromise.then(onCredsGot).catch(onError);
        }
    }, 10);
});