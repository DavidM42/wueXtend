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

// TODO write central js file for getting credentials from storage to use in this and wuestudy
function onCredsGot(credsObj) {
	const username = credsObj.username;
	const password = credsObj.password;
	loginForm(username, password);
}

function onError(error) {
	console.log(`Error: ${error}`);
}

browser.extension.sendMessage({}, function (response) {
	var readyStateCheckInterval = setInterval(function () {
		if (document.readyState === "complete") {
			clearInterval(readyStateCheckInterval);

			// browser.storage.local.set({
			// 	username: 'sXXX',
			// 	password: '123445',
			// })

			// would like sync storagearea not local but android firefox does not support I think
			// need storage permission
			if (document.getElementById('loginerrormessage') == null && document.getElementsByClassName('alert').length == 0) {
				const getPromise = browser.storage.local.get(['username', 'password']);
				getPromise.then(onCredsGot, onError);
			}

		}
	}, 10);
});