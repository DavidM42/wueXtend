chrome.extension.sendMessage({}, function (response) {
	var readyStateCheckInterval = setInterval(function () {
		if (document.readyState === "complete") {
			clearInterval(readyStateCheckInterval);

			// ----------------------------------------------------------
			// This part of the script triggers when page is done loading
			console.log("Hello. This message was sent from scripts/inject.js");
			// ----------------------------------------------------------

			const username = 'sXXXXX';
			const password = 'ExamplePassword';

			const usernameField = document.getElementById('username');
			const passwordField = document.getElementById('password');

			usernameField.value = username;
			passwordField.value = password;

			document.getElementById('loginbtn').click();


		}
	}, 10);
});