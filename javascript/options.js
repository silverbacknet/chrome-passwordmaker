function updateStyle(element, selected, isSelected) {
    if (isSelected) {
        element.addClass(selected);
    } else {
        element.removeClass(selected);
    }
}

function updateExample() {
    updateStyle($("#exprotocol"), "selected", $("#protocolCB").prop("checked"));
    updateStyle($("#exsubdomain"), "selected", $("#subdomainCB").prop("checked"));
    updateStyle($("#exdomain"), "selected", $("#domainCB").prop("checked"));
    updateStyle($("#expath"), "selected", $("#pathCB").prop("checked"));
}

function updateLeet() {
    $("#leetLevelLB").prop("disabled", $("#whereLeetLB").val() === "off");
    updateStyle($("#leetLevelLabel"), "disabled", $("#whereLeetLB").val() === "off");
}

function addProfile() {
    var p = Object.create(Profile);
    p.title = "No name";
    Settings.addProfile(p);
    updateProfileList();
    setCurrentProfile(p);
}

function removeProfile() {
    if (confirm("Really delete this profile?")) {
        Settings.deleteProfile(Settings.currentProfile);
        updateProfileList();
        setCurrentProfile(Settings.profiles[0]);
    }
}

function removeAllProfiles() {
    if (confirm("Really delete ALL local profile customizations and reset to the default profiles?")) {
        browser.storage.local.remove("profiles");
        Settings.loadLocalProfiles(function(){updateProfileList();});
    }
}

function setCurrentProfile(profile) {
    Settings.currentProfile = profile.id;
    $("#profileNameTB").val(profile.title);
    $("#siteList").val(profile.siteList);
    $("#protocolCB").prop("checked", profile.url_protocol);
    $("#subdomainCB").prop("checked", profile.url_subdomain);
    $("#domainCB").prop("checked", profile.url_domain);
    $("#pathCB").prop("checked", profile.url_path);
    $("#inputUseThisText").val(profile.strUseText);
    $("#whereLeetLB").val(profile.whereToUseL33t);
    $("#leetLevelLB").val(profile.l33tLevel);
    $("#hashAlgorithmLB").val(profile.hashAlgorithm);
    $("#passwdLength").val(profile.passwordLength);
    $("#usernameTB").val(profile.username);
    $("#modifier").val(profile.modifier);
    $("#passwordPrefix").val(profile.passwordPrefix);
    $("#passwordSuffix").val(profile.passwordSuffix);

    $("#charset").empty();
    for (var i = 0; i < CHARSET_OPTIONS.length; i++) {
        $("#charset").append(new Option(CHARSET_OPTIONS[i]));
    }
    $("#charset").append(new Option("Custom charset"));

    if (CHARSET_OPTIONS.indexOf(profile.selectedCharset) >= 0) {
        $("#charset").val(profile.selectedCharset);
    } else {
        $("#charset").val("Custom charset");
        $("#customCharset").val(profile.selectedCharset);
    }

    updateCustomCharsetField();
    updateExample();
    updateLeet();
    highlightProfile();
    // Keeps profile #1 around so it can only be re-named
    if (Settings.profiles[0].id === profile.id) {
        $("#remove").hide();
    } else {
        $("#remove").show();
    }

    showSection("#profile_settings");
    setTimeout(function() {
        hashWarning(profile.hashAlgorithm);
    }, 0);
}

function updateCustomCharsetField() {
    if ($("#charset").val() === "Custom charset") {
        $("#customCharset").val(Settings.getProfile(Settings.currentProfile).selectedCharset).show();
    } else {
        $("#customCharset").hide();
    }
}

function hashWarning(hash) {
    // Be as annoying as possible to try and stop people from using the bugged algorithms
    var bugged = { "md5_v6": 1, "hmac-md5_v6": 1, "hmac-sha256": 1 };
    if (bugged[hash]) {
        if (confirm("Are you sure you want to continue using a legacy algorithm which is incorrectly implemented?")) {
            alert("Please change to using a correct & secure algorithm!\n\nThe old/bugged/legacy algorithms " +
                "are harmful to your online security and should be avoided at ALL costs.\n\n" +
                "Please change your passwords on the sites which you are using this algorithm if you are able to " +
                "as soon as possible.\n\nThank you\n");
        } else {
            alert("Please select one of the correct and secure hash algorithms below :)");
        }
    }
}

function showImport() {
    showSection("#import_settings");
}

function showExport() {
    showSection("#export_settings");
    $("#exportText").val(RdfImporter.dumpDoc());
}

function importRdf() {
    var txt = $("#importText").val();

    if (txt.trim().length === 0) {
        alert("Import text is empty");
        return false;
    }

    var rdfDoc = RdfImporter.loadDoc(txt);
    // Check that profiles have been parsed and are available before wiping current data
    if (rdfDoc.profiles.length > 0 && $("#importOverwrite").prop("checked")) {
        Settings.profiles = [];
    }

    if (RdfImporter.saveProfiles(rdfDoc.profiles) === 0) {
        alert("Sorry, no profiles found");
        return false;
    }

    updateProfileList();
}

function copyRdfExport() {
    $("#exportText").get(0).select();
    document.execCommand("copy");
}

function showOptions() {
    var setPromise = browser.storage.sync.get("synced_profiles");
    setPromise.then(
        //something in sync data
        function(data) {
            if(Object.keys(data).length>0) {
                Settings.syncDataAvailable = true;
                Settings.syncPasswordOk = Boolean(Settings.decrypt(Settings.sync_profiles_password, data.synced_profiles));
            } else {
                Settings.syncDataAvailable = false;
                Settings.syncPasswordOk = false;
            }
        },
        //error accessing sync data
        function() {
            Settings.syncDataAvailable = false;
            Settings.syncPasswordOk = false;
    });

    $("#store_location").val(Settings.store_location);
    $("#expirePasswordMinutes").val(Settings.expire_password_minutes || 5);
    updateStyle($("#master_password_row"), "hidden", !Settings.keepMasterPasswordHash());
    updateExpireRow();
    updateSyncProfiles();
    showSection("#general_settings");
}

function showInformation() {
    showSection("#general_information");
}

function showSection(showId) {
    $("#checkStrength").prop("checked", false);
    showStrengthSection();
    $("section").add("aside").not(showId).css("display", "none");
    $(showId).css("display", "block");
}

function highlightProfile() {
    $(".highlight").removeClass("highlight");
    $("#profile_" + Settings.currentProfile).addClass("highlight");
}

function updateStorageLocation() {
    Settings.setStoreLocation($("#store_location").val());
    updateExpireRow();
}

function saveProfile() {
    var selected = Settings.getProfile(Settings.currentProfile);

    selected.title          = $("#profileNameTB").val().trim();
    selected.siteList       = $("#siteList").val().trim().split(/\s+/).join(" ");
    selected.url_protocol   = $("#protocolCB").prop("checked");
    selected.url_subdomain  = $("#subdomainCB").prop("checked");
    selected.url_domain     = $("#domainCB").prop("checked");
    selected.url_path       = $("#pathCB").prop("checked");
    selected.strUseText     = $("#inputUseThisText").val().trim();
    selected.whereToUseL33t = $("#whereLeetLB").val();
    selected.l33tLevel      = $("#leetLevelLB").val();
    selected.hashAlgorithm  = $("#hashAlgorithmLB").val();
    selected.passwordLength = $("#passwdLength").val();
    selected.username       = $("#usernameTB").val().trim();
    selected.modifier       = $("#modifier").val().trim();
    selected.passwordPrefix = $("#passwordPrefix").val();
    selected.passwordSuffix = $("#passwordSuffix").val();

    // make sure default profile siteList and strUseText stays blank/generic
    if (Settings.profiles[0].id === selected.id) {
        selected.siteList = "";
        selected.strUseText = "";
    }

    if ($("#charset").val() === "Custom charset") {
        selected.selectedCharset = $("#customCharset").val();
    } else {
        selected.selectedCharset = $("#charset").val();
    }

    Settings.saveProfiles();
    updateProfileList();
    highlightProfile();
    setTimeout(function() {
        hashWarning(selected.hashAlgorithm);
    }, 0);
}

function cloneProfile() {
    var p = $.extend(Object.create(Profile), Settings.getProfile(Settings.currentProfile));
    p.title = p.title + " Copy";
    Settings.addProfile(p);
    updateProfileList();
    setCurrentProfile(p);
}

function editProfile(event) {
    setCurrentProfile(Settings.getProfile(event.target.id.slice(8)));
}

function updateProfileList() {
    $("#profile_list").empty();
    //console.log(`Number profiles: ${Settings.profiles.length}`)
    for (var i = 0; i < Settings.profiles.length; i++) {
        $("#profile_list").append("<li><span id='profile_" + Settings.profiles[i].id + "' class='link'>" + Settings.profiles[i].title + "</span></li>");
    }
}

function setSyncPassword() {
    if ($("#syncProfilesPassword").val() === "") {
        alert("Please enter a password to enable sync");
        return;
    }

    Settings.startSyncWith($("#syncProfilesPassword").val(), function(){
        $("#syncProfilesPassword").val("");
        updateSyncProfiles();
        updateProfileList();       
    }, function(){
        alert("Wrong password. Please specify the password you used when initially syncing your data");       
    });
 }

function clearSyncData() {
    var clearPromise = browser.storage.sync.clear()

    clearPromise.then(
        //success clearing sync
        function() {
            Settings.sync_profiles = false;
            browser.storage.local.remove("synced_profiles");
            browser.storage.local.remove("synced_profiles_keys");
            browser.storage.local.remove("sync_profiles_password");
            Settings.sync_profiles_password = "";
            Settings.syncDataAvailable = false;
            Settings.syncPasswordOk = false;
            Settings.loadLocalProfiles(function(){
                Settings.syncDataAvailable = false;             
                updateSyncProfiles();
                updateProfileList();   
            });
        },
        //error clearing sync
        function() {
            alert("Could not delete synced data: " + browser.runtime.lastError);
        }
    );
}

function updateSyncProfiles() {
    $("#sync_profiles_row, #no_sync_password, #sync_data_exists, #sync_password_set").hide();
    $("#set_sync_password, #clear_sync_data").addClass("hidden");
    //console.log(`updateSyncProfiles syncPasswordOk ${Settings.syncPasswordOk}, synDataAvailable ${Settings.syncDataAvailable}`);
    if ($("#syncProfiles").prop("checked")) {
        if (Settings.syncPasswordOk) {
            $("#sync_password_set").show();
            $("#clear_sync_data").removeClass("hidden");
        } else if (Settings.syncDataAvailable) {
            $("#sync_profiles_row, #sync_data_exists").show();
            $("#set_sync_password, #clear_sync_data").removeClass("hidden");
        } else {
            $("#sync_profiles_row, #no_sync_password").show();
            $("#set_sync_password").removeClass("hidden");
        }
    } else {
        Settings.stopSync();
        updateProfileList();
    }
}

function updateMasterHash() {
    if ($("#keepMasterPasswordHash").prop("checked")) {
        $("#master_password_row").removeClass("hidden");
        var master_pass = $("#masterPassword").val();
        if (master_pass.length > 0) {
            browser.storage.local.set({keep_master_password_hash: true, master_password_hash: JSON.stringify(Settings.make_pbkdf2(master_pass))});
            Settings.keep_master_password_hash = true;
            Settings.master_password_hash = JSON.stringify(Settings.make_pbkdf2(master_pass))
        } else {
            browser.storage.local.set({keep_master_password_hash: false});
            browser.storage.local.remove("master_password_hash")
            Settings.keep_master_password_hash = false;
            Settings.master_password_hash = "";
        }
    } else {
        $("#master_password_row").addClass("hidden");
        $("#masterPassword").val("");
        Settings.keep_master_password_hash = false;
        browser.storage.local.set({keep_master_password_hash: false});
        Settings.master_password_hash = "";
        browser.storage.local.remove("master_password_hash")
    }
}

function updateDisablePasswordSaving() {
    var should_disable = $("#disablePasswordSaving").prop("checked");
    Settings.disable_password_saving = should_disable;
    browser.storage.local.set({disable_password_saving: should_disable})
    if (should_disable) {
        Settings.store_location = "never";
        browser.storage.local.set({store_location: "never"})
        Settings.password_crypt = "";
        browser.storage.local.remove("password_crypt");
        Settings.setBgPassword("");
    }
}

function updateHidePassword() {
    Settings.show_generated_password = $("#hidePassword").prop("checked");
    browser.storage.local.set({show_generated_password: $("#hidePassword").prop("checked")});
}

function updateUseVerificationCode() {
    browser.storage.local.set({use_verification_code: $("#useVerificationCode").prop("checked")});
    Settings.use_verification_code = $("#useVerificationCode").prop("checked");
}

function updatefillUsername() {
    browser.storage.local.set({fill_username: $("#fillUsername").prop("checked") });
}

function updateRememberSiteProfile() {
    Settings.remember_site_profile = $("#rememberSiteProfile").prop("checked");
}

function updateHideStoreLocation() {
    browser.storage.local.set({hide_storage_location: $("#hideStorageLocation").prop("checked")});
}

function updateShowStrength() {
    browser.storage.local.set({show_password_strength: $("#showPasswordStrength").prop("checked")});
}

function sanitizePasswordLength() {
    var field = $("#passwdLength");
    if (field.val() < 4) field.val("4");
    if (field.val() > 512) field.val("512");
}


function sanitizeExpireTime(newExpireTime) {
    var field = $("#expirePasswordMinutes");
    if (newExpireTime < 1) {
        newExpireTime = 1;
        field.val("1");
    }
    if (newExpireTime > 720) {
        newExpireTime = 720;
        field.val("720");
    }
    newExpireTime = parseInt(newExpireTime, 10);
    field.val(newExpireTime);
    return newExpireTime;
}

function updateExpireRow() {
    var shouldExpire = Settings.store_location === "memory_expire";
    var oldExpireTime = Settings.expire_password_minutes || 5;
    var newExpireTime = $("#expirePasswordMinutes").val();
    if (shouldExpire) {
        newExpireTime = sanitizeExpireTime(newExpireTime);
        if (newExpireTime !== oldExpireTime) {
          browser.storage.local.set({expire_password_minutes: newExpireTime});
        	Settings.expire_password_minutes = newExpireTime;
          Settings.createExpirePasswordAlarm(newExpireTime);
        }
    } else {
        browser.alarms.clear("expire_password");
    }
    updateStyle($("#password_expire_row"), "hidden", !shouldExpire);
}

function fileImport() {
    var file = $("#fileInput")[0].files[0];
    if ((/rdf|xml/i).test(file.type)) {
        var reader = new FileReader();
        reader.onload = function() {
            $("#importText").val(reader.result);
        };
        reader.readAsBinaryString(file);
    } else {
        $("#importText").val("Please select an RDF or XML file containing PasswordMaker profile data.");
    }
}

function fileExport() {
    var textFileAsBlob = new Blob([$("#exportText").val()], {
        type: "application/rdf+xml"
    });
    var downloadPromise = browser.downloads.download({
        url: window.URL.createObjectURL(textFileAsBlob),
        filename: "PasswordMaker Pro Profile Data.rdf",
        conflictAction : 'uniquify'
    });
}

function showStrengthSection() {
    if ($("#checkStrength").prop("checked")) {
        $("main").width("1150px");
        $("#strength_section").css("display", "inline-block");
        $(".testInput").on("change keyup", checkPassStrength);
        checkPassStrength();
    } else {
        $("main").width("900px");
        $("#strength_section").hide();
        $(".testInput").off("change keyup", checkPassStrength);
        $(".strengthInput").val("");
    }
}

function checkPassStrength() {
    var selected = Settings.getProfile(Settings.currentProfile);

    selected.siteList       = $("#siteList").val().trim().replace(/[*?$+()^\[\]\\|{},]/g, "").split(/\s+/).shift();
    selected.url_protocol   = $("#protocolCB").prop("checked");
    selected.url_subdomain  = $("#subdomainCB").prop("checked");
    selected.url_domain     = $("#domainCB").prop("checked");
    selected.url_path       = $("#pathCB").prop("checked");
    selected.strUseText     = $("#inputUseThisText").val().trim();
    selected.whereToUseL33t = $("#whereLeetLB").val();
    selected.l33tLevel      = $("#leetLevelLB").val();
    selected.hashAlgorithm  = $("#hashAlgorithmLB").val();
    selected.passwordLength = $("#passwdLength").val();
    selected.username       = $("#usernameTB").val().trim();
    selected.modifier       = $("#modifier").val().trim();
    selected.passwordPrefix = $("#passwordPrefix").val();
    selected.passwordSuffix = $("#passwordSuffix").val();

    if ($("#charset").val() === "Custom charset") {
        selected.selectedCharset = $("#customCharset").val();
    } else {
        selected.selectedCharset = $("#charset").val();
    }

    if (selected.getText().length !== 0) {
        $("#testText").val(selected.getText());
    } else {
        $("#testText").val(selected.getUrl(selected.siteList));
    }

    $("#genPass").val(selected.getPassword($("#testText").val(), $("#testPass").val(), selected.username));
    var values = Settings.getPasswordStrength($("#genPass").val());
    $("#genStrength, meter").val(values.strength);
    $("#hasUpper").prop("checked", values.hasUpper);
    $("#hasLower").prop("checked", values.hasLower);
    $("#hasDigit").prop("checked", values.hasDigit);
    $("#hasSymbol").prop("checked", values.hasSymbol);
}

function thisbottomHalf() {
    updateProfileList();
    //console.log(`Listener Profiles: ${Settings.profiles}`);
    setCurrentProfile(Settings.profiles[0]);

    $("#hidePassword").prop("checked", Settings.shouldHidePassword());
    $("#disablePasswordSaving").prop("checked", Settings.shouldDisablePasswordSaving());
    $("#keepMasterPasswordHash").prop("checked", Settings.keepMasterPasswordHash());
    $("#useVerificationCode").prop("checked", Settings.useVerificationCode());
    $("#fillUsername").prop("checked", Settings.shouldFillUsername());
    $("#rememberSiteProfile").prop("checked", Settings.remember_site_profile);
    $("#hideStorageLocation").prop("checked", Settings.hideStoreLocationInPopup());
    $("#showPasswordStrength").prop("checked", Settings.shouldShowStrength());
    $("#syncProfiles").prop("checked", Settings.shouldSyncProfiles());

    $("#profile_list").on("click", ".link", editProfile);
    $("#add").on("click", addProfile);
    $("#showImport").on("click", showImport);
    $("#showExport").on("click", showExport);
    $("#showSettings").on("click", showOptions);
    $("#showInformation").on("click", showInformation);

    $("#protocolCB").on("change", updateExample);
    $("#subdomainCB").on("click", updateExample);
    $("#domainCB").on("click", updateExample);
    $("#pathCB").on("click", updateExample);
    $("#whereLeetLB").on("change", updateLeet);
    $("#charset").on("change", updateCustomCharsetField);
    $("#passwdLength").on("blur", sanitizePasswordLength);

    $("#cloneProfileButton").on("click", cloneProfile);
    $("#checkStrength").on("change", showStrengthSection);
    $("#remove").on("click", removeProfile);
    $("#save").on("click", saveProfile);
    $("#importButton").on("click", importRdf);
    $("#fileInput").on("change", fileImport);
    $("#copyButton").on("click", copyRdfExport);
    $("#exportFileButton").on("click", fileExport);

    $("#store_location").on("change", updateStorageLocation);
    $("#expirePasswordMinutes").on("change", updateExpireRow);
    $("#hidePassword").on("change", updateHidePassword);
    $("#disablePasswordSaving").on("change", updateDisablePasswordSaving);
    $("#keepMasterPasswordHash").on("change", updateMasterHash);
    $("#syncProfiles").on("change", updateSyncProfiles);
    $("#masterPassword").on("keyup", updateMasterHash);
    $("#useVerificationCode").on("change", updateUseVerificationCode);
    $("#fillUsername").on("change", updatefillUsername);
    $("#rememberSiteProfile").on("change", updateRememberSiteProfile);
    $("#hideStorageLocation").on("change", updateHideStoreLocation);
    $("#showPasswordStrength").on("change", updateShowStrength);
    $("#set_sync_password").on("click", setSyncPassword);
    $("#clear_sync_data").on("click", clearSyncData);
    $("#resetToDefaultprofiles").on("click", removeAllProfiles);
}

document.addEventListener("DOMContentLoaded", function() {
  //console.log(`options: Profile number ${Settings.profiles.length}`);
    Settings.loadProfiles(thisbottomHalf);
});
