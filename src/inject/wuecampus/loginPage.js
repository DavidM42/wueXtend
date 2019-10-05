function loginForm(username, password) {
	const usernameField = document.getElementById('username');
	const passwordField = document.getElementById('password');

	usernameField.value = username;
	passwordField.value = password;

	const loginButton = document.getElementById('loginbtn');
	loginButton.click();
}

// TODO write central js file for getting credentials from storage to use in this and wuestudy
function onCredsGot(credsObj) {
	const username = credsObj.username;
	const password = credsObj.password;
	loginForm(username,password);
}

function onError(error) {
	console.log(`Error: ${error}`);
}

browser.extension.sendMessage({}, function (response) {
	var readyStateCheckInterval = setInterval(function () {
		if (document.readyState === "complete") {
			clearInterval(readyStateCheckInterval);

			// browser.storage.local.set({
			// 	username: 'sXXXX',
			// 	password: 'Password',
			// })

			// would like sync storagearea not local but android firefox does not support I think
			// need storage permission
			const getPromise = browser.storage.local.get(['username', 'password']);
			getPromise.then(onCredsGot, onError);
		}
	}, 10);
});