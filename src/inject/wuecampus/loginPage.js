// import { saveSettings } from '../credentials.js';
function saveSettings(usernameIn,passwordIn) {
    browser.storage.local.set({
        username: usernameIn,
        password: passwordIn,
    })
}


function loginForm(username, password) {
	const usernameField = document.getElementById('username');
	const passwordField = document.getElementById('password');

	usernameField.value = username;
	passwordField.value = password;

	const loginButton = document.getElementById('loginbtn');
	loginButton.click();

	// TODO fix this to only show if no redirect after click so failed
	// if (window.location.pathname.includes('/login/')) {
	// console.log('still on login page so login failed');
	// alert('Login Credentials given in the addon are wrong, please change them and reload');
	// }
}

function ripPasswordsFromForm() {
	const username = document.getElementById('username').value;
	const password = document.getElementById('password').value;
	console.log('Will save settings received from form')
	saveSettings(username,password)
}

// TODO write central js file for getting credentials from storage to use in this and wuestudy
function onCredsGot(credsObj) {
	const username = credsObj.username;
	const password = credsObj.password;
	const autoLogin = credsObj.autoLogin;

	if (username === undefined || password === undefined) {
		// if no username password were set get the ones entered on first login onclick of loginBtn
		const loginButton = document.getElementById('loginbtn');
		loginButton.onclick = ripPasswordsFromForm;
	} else {
		// option to opt out of auto login
        if (autoLogin !== false) {
			// username/password combo set so login with these
			loginForm(username, password);
		}
	}
}

function onError(error) {
	console.log(`Error: ${error}`);
}

browser.extension.sendMessage({}, function (response) {
	var readyStateCheckInterval = setInterval(function () {
		if (document.readyState === "complete") {
			clearInterval(readyStateCheckInterval);

			// document.getElementsByClassName('alert').length == 0
			// would like sync storagearea not local but android firefox does not support I think
			// need storage permission
			// TODO better if else for more readability
			const noLoginError = document.getElementById('loginerrormessage') === null;
			if (noLoginError) {
				// TODO fix this here not getting executed
				const getPromise = browser.storage.local.get(['username', 'password', 'autoLogin']);
				getPromise.then(onCredsGot, onError);
			} else {
				const sessionInvalid = document.getElementById('loginerrormessage').innerText.toLocaleLowerCase().includes('session');
				if (sessionInvalid) {
					const getPromise = browser.storage.local.get(['username', 'password', 'autoLogin']);
					getPromise.then(onCredsGot, onError);
				}
			}

		}
	}, 10);
});