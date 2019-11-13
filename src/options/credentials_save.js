const saveSettings = () => {
    browser.storage.local.set({
        username: document.getElementById('username').value.toLowerCase(),
        password: document.getElementById('password').value,
        autoLogin: document.getElementById('autoLogin').checked,
    });
}

// prefills field with values from storage
const preloadFieldsValue = (credsObj) => {
    console.log(credsObj);
    if (credsObj.username !== undefined) {
        document.getElementById('username').value = credsObj.username;
    }
    if (credsObj.password !== undefined) {
        document.getElementById('password').value = credsObj.password;
    }
    if (credsObj.autoLogin !== undefined) {
        document.getElementById('autoLogin').checked = credsObj.autoLogin;
    }
}

const onError = (error) => {
	console.log(`Error: ${error}`);
}

window.onload = () => {
    
    // need to attach event handler cause onlclick attribute is conten security policy disallowed cause inline
    document.getElementById('saveBtn').onclick = saveSettings;

    // get creds and prefill
    const getPromise = browser.storage.local.get(['username', 'password', 'autoLogin']);
    getPromise.then(preloadFieldsValue).catch(onError);
}