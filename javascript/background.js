var password = "";

function updateSyncedProfiles(data) {
    //console.log(`updateSyncedProfiles ${data.synced_profiles}`);
    //console.log(`type ${typeof (data.synced_profiles)}`);
    browser.storage.local.set({synced_profiles_keys: ""});
    if (data.synced_profiles === undefined) {
        data.synced_profiles = "";
    } else if (typeof (data.synced_profiles) !== "string") {
        var profiles = "";
        data.synced_profiles.forEach(function(key) {
            profiles += data[key];
        });
        //console.log(`Synced profile keys ${data.synced_profiles.join()}`)
        browser.storage.local.set({synced_profiles_keys: data.synced_profiles.join()});
        data.synced_profiles = profiles;
    }
    browser.storage.local.set({synced_profiles: data.synced_profiles});
}

var getPromise = browser.storage.sync.get("synced_profiles");

getPromise.then(function(data) {
    updateSyncedProfiles(data);
    });

browser.storage.onChanged.addListener(function(changes, namespace) {
    if (namespace !== "sync") {
        return;
    }
    if (changes.synced_profiles !== undefined) {
        var flattened = {};
        Object.keys(changes).forEach(function(key) {
            flattened[key] = changes[key].newValue;
        });
        updateSyncedProfiles(flattened);
    }
});

function handleAlarm(alarm) {
    if (alarm.name === "expire_password") {
        password = "";
    }
}

browser.alarms.onAlarm.addListener(handleAlarm);
