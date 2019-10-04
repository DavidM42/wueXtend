function loginFlow(username, password) {
    const loginClassElements = document.getElementsByClassName('input_login_hisinone');

    if (loginClassElements.length > 0) {
        console.log("You are not logged in. Will log in now")

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
    }
}


browser.extension.sendMessage({}, function (response) {
    var readyStateCheckInterval = setInterval(function () {
        if (document.readyState === "complete") {
            clearInterval(readyStateCheckInterval);

            const username = 'sXXXX';
            const password = 'password';

            //handle login if not logged in
            // loginFlow(username, password);

        }
    }, 10);
});