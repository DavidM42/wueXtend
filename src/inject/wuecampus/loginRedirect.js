function onCredsGot(credsObj) {
	const autoLogin = credsObj.autoLogin;
	if (autoLogin !== false) {


		// check login status here and redirect to login page to login if not
		let loggedIn = true;
		const loginSpans = document.getElementsByClassName("login");
		if (loginSpans.length > 0) {
			for (let i = 0; i < loginSpans.length; i++) {
				if (loginSpans[i].innerText.includes('sind nicht angemeldet') ||
					loginSpans[i].innerText.includes('sind als Gast angemeldet')) {
					loggedIn = false;
				}
			}
		}

		if (!loggedIn) {
			console.log("You are not logged in will now login");
			window.location.href = 'https://wuecampus2.uni-wuerzburg.de/moodle/login/index.php';
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

			const getPromise = browser.storage.local.get(['autoLogin']);
			getPromise.then(onCredsGot, onError);
		}
	}, 10);
});