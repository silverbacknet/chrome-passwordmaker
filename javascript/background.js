var password = "";

function updateSyncedProfiles(data) {
    browser.storage.local.set({synced_profiles_keys: ""});
    if (data.synced_profiles === undefined) {
        data.synced_profiles = "";
    } else if (typeof (data.synced_profiles) !== "string") {
        var profiles = "";
        data.synced_profiles.forEach(function(key) {
            profiles += data[key];
        });
        browser.storage.local.set({synced_profiles_keys: data.synced_profiles.join()});
        data.synced_profiles = profiles;
    }
    browser.storage.local.set({synced_profiles: data.synced_profiles});
}

var getPromise = browser.storage.sync.get();

getPromise.then(function(data) {
    updateSyncedProfiles(data);
    if (data.sync_profiles_password !== undefined) {
        browser.storage.local.set({sync_profiles_password: data.sync_profiles_password});
      }});

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
    if (changes.sync_profiles_password !== undefined) {
        browser.storage.local.set({sync_profiles_password: changes.sync_profiles_password.newValue || ""});
    }
});

function handleAlarm(alarm) {
    if (alarm.name === "expire_password") {
        password = "";
    }
}

browser.alarms.onAlarm.addListener(handleAlarm);
