QUnit.module("rdf import", {
    beforeEach: function() {
        this.rdf_doc1 = RdfImporter.loadDoc($("#rdf1").val());
    },
    afterEach: function() {
        Settings.profiles = [];
        browser.storage.local.clear();
    }
});

QUnit.test("parse global settings", function(assert) {
    var s = this.rdf_doc1.settings;

    assert.equal(s.rdf_about, "http://passwordmaker.mozdev.org/globalSettings");
    assert.equal(s.hideMasterPassword, false);
    assert.equal(s.storeLocation, "memory");
});

QUnit.test("find profiles", function(assert) {
    assert.equal(this.rdf_doc1.profiles.length, 2);
});

QUnit.test("load profile", function(assert) {
    var p = this.rdf_doc1.profiles[1];

    assert.equal(p.rdf_about, "rdf:#$5PGpU1");
    assert.equal(p.title, "nospecial");
    assert.equal(p.url_protocol, false);
    assert.equal(p.url_subdomain, false);
    assert.equal(p.url_domain, true);
    assert.equal(p.url_path, true);
    assert.equal(p.hashAlgorithm, "hmac-sha256_fix");
    assert.equal(p.username, "username1");
    assert.equal(p.modifier, "modifier1");
    assert.equal(p.passwordLength, 20);
    assert.equal(p.selectedCharset, "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz");
    assert.equal(p.passwordPrefix, "prefix1");
    assert.equal(p.passwordSuffix, "suffix1");
    assert.equal(p.whereToUseL33t, "before-hashing");
    assert.equal(p.l33tLevel, 1);
    assert.equal(p.siteList, "/https?://mail\\.yahoo\\.com/.*/ http?://github.com/*");
});

QUnit.test("load default profile", function(assert) {
    var p = this.rdf_doc1.profiles[0];

    assert.equal(p.rdf_about, "http://passwordmaker.mozdev.org/defaults");
    assert.equal(p.title, "Defaults");
    assert.equal(p.url_protocol, false);
    assert.equal(p.url_subdomain, false);
    assert.equal(p.url_domain, true);
    assert.equal(p.url_path, true);
    assert.equal(p.hashAlgorithm, "sha256");
    assert.equal(p.username, "username1");
    assert.equal(p.modifier, "modifier1");
    assert.equal(p.passwordLength, 15);
    assert.equal(p.selectedCharset, "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789`~!@#$%");
    assert.equal(p.passwordPrefix, "prefix1");
    assert.equal(p.passwordSuffix, "suffix1");
    assert.equal(p.whereToUseL33t, "off");
    assert.equal(p.l33tLevel, 1);
    assert.equal(p.siteList, "");
});

QUnit.test("save profiles", function(assert) {
    var done = assert.async();
    var profiles = this.rdf_doc1.profiles;

    assert.equal(profiles.length, 2);
    Settings.createDefaultProfiles();
    Settings.loadProfiles(function(){
        console.log(`test ${Settings.profiles.length}`);
        assert.equal(Settings.profiles.length, 2);

        RdfImporter.saveProfiles(profiles);
        assert.equal(Settings.profiles.length, 4);
        done();
    });
});

QUnit.test("save settings", function(assert) {
    Settings.setStoreLocation("memory");

    assert.equal(Settings.store_location, "memory");
});

QUnit.module("rdf export", {
    beforeEach: function(assert) {
        var done = assert.async();
        var mod = this;
        Settings.loadProfiles(function(){
            mod.rdf_doc1 = RdfImporter.loadDoc($("#rdf1").val());
            RdfImporter.saveProfiles(mod.rdf_doc1.profiles);
            mod.doc2 = RdfImporter.loadDoc(RdfImporter.dumpDoc());
            console.log(`doc2 profile ${mod.doc2.profiles.length}`);
            done();
        });
    },
    afterEach: function() {
        Settings.profiles = [];
        browser.storage.local.clear();
    }
});

QUnit.test("dump profile to rdf", function(assert) {
    console.log("trying to use doc2");
    assert.equal(this.doc2.profiles.length>3, true);
    var p = this.doc2.profiles[3];

    assert.equal(p.rdf_about, "rdf:#$CHROME4");
    assert.equal(p.title, "nospecial");
    assert.equal(p.url_protocol, false);
    assert.equal(p.url_subdomain, false);
    assert.equal(p.url_domain, true);
    assert.equal(p.url_path, true);
    assert.equal(p.hashAlgorithm, "hmac-sha256_fix");
    assert.equal(p.username, "username1");
    assert.equal(p.modifier, "modifier1");
    assert.equal(p.passwordLength, 20);
    assert.equal(p.selectedCharset, "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz");
    assert.equal(p.passwordPrefix, "prefix1");
    assert.equal(p.passwordSuffix, "suffix1");
    assert.equal(p.whereToUseL33t, "before-hashing");
    assert.equal(p.l33tLevel, 1);
    assert.equal(p.siteList, "/https?://mail\\.yahoo\\.com/.*/ http?://github.com/*");
});

QUnit.test("dump default profile to rdf", function(assert) {
    var p = this.doc2.profiles[2];

    assert.equal(p.rdf_about, "rdf:#$CHROME3");
    assert.equal(p.title, "Defaults");
    assert.equal(p.url_protocol, false);
    assert.equal(p.url_subdomain, false);
    assert.equal(p.url_domain, true);
    assert.equal(p.url_path, true);
    assert.equal(p.hashAlgorithm, "sha256");
    assert.equal(p.username, "username1");
    assert.equal(p.modifier, "modifier1");
    assert.equal(p.passwordLength, 15);
    assert.equal(p.selectedCharset, "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789`~!@#$%");
    assert.equal(p.passwordPrefix, "prefix1");
    assert.equal(p.passwordSuffix, "suffix1");
    assert.equal(p.whereToUseL33t, "off");
    assert.equal(p.l33tLevel, 1);
    assert.equal(p.siteList, "");
});

QUnit.module("password generation", {
    beforeEach: function(assert) {
        var mod = this;
        var done = assert.async();
        Settings.loadProfiles(function(){
            mod.p = Settings.profiles[0];
            mod.url = "passwordmaker.org";
            mod.pass = "PasswordMaker©€𤭢";
            done();
        });
    },
    afterEach: function() {
        Settings.profiles = [];
        browser.storage.local.clear();
    }
});

QUnit.test("algorithms", function(assert) {
    this.p.hashAlgorithm = "md4";
    assert.equal(btoa(this.p.getPassword(this.url, this.pass)), "SFAkbkwxL34=", "MD4 variant");
    this.p.hashAlgorithm = "hmac-md4";
    assert.equal(btoa(this.p.getPassword(this.url, this.pass)), "RCN8R3tmZjc=", "HMAC-MD4 variant");
    this.p.hashAlgorithm = "md5";
    assert.equal(btoa(this.p.getPassword(this.url, this.pass)), "Sj5TJ3BdVFA=", "MD5 variant");
    this.p.hashAlgorithm = "md5_v6";
    assert.equal(btoa(this.p.getPassword(this.url, this.pass)), "ZTAwM2U1YzI=", "MD5 Version 0.6 variant");
    this.p.hashAlgorithm = "hmac-md5";
    assert.equal(btoa(this.p.getPassword(this.url, this.pass)), "SnYnIlIqRjc=", "HMAC-MD5 variant");
    this.p.hashAlgorithm = "hmac-md5_v6";
    assert.equal(btoa(this.p.getPassword(this.url, this.pass)), "ODY4M2M4Mjc=", "HMAC-MD5 Version 0.6 variant");
    this.p.hashAlgorithm = "sha1";
    assert.equal(btoa(this.p.getPassword(this.url, this.pass)), "NHEzImJNXkQ=", "SHA-1 variant");
    this.p.hashAlgorithm = "hmac-sha1";
    assert.equal(btoa(this.p.getPassword(this.url, this.pass)), "Q1JtdmdsZ1E=", "HMAC-SHA-1 variant");
    this.p.hashAlgorithm = "sha256";
    assert.equal(btoa(this.p.getPassword(this.url, this.pass)), "NWVueCklb1o=", "SHA-256 variant");
    this.p.hashAlgorithm = "hmac-sha256_fix";
    assert.equal(btoa(this.p.getPassword(this.url, this.pass)), "fjVtT2F9NXQ=", "HMAC-SHA-256 variant");
    this.p.hashAlgorithm = "hmac-sha256";
    assert.equal(btoa(this.p.getPassword(this.url, this.pass)), "UHw4TDt8dFw=", "HMAC-SHA-256 Version 1.5.1 variant");
    this.p.hashAlgorithm = "rmd160";
    assert.equal(btoa(this.p.getPassword(this.url, this.pass)), "RGBCQm9nIyM=", "RIPEMD-160 variant");
    this.p.hashAlgorithm = "hmac-rmd160";
    assert.equal(btoa(this.p.getPassword(this.url, this.pass)), "QiMrbkMjcio=", "HMAC-RIPEMD-160 variant");
    this.p.l33tLevel = 9;
    this.p.hashAlgorithm = "md5";
    this.p.whereToUseL33t = "before-hashing";
    assert.equal(btoa(this.p.getPassword(this.url, this.pass)), "RWs4TnZyLWg=", "Before L33t variant");
    this.p.whereToUseL33t = "after-hashing";
    assert.equal(btoa(this.p.getPassword(this.url, this.pass)), "X3w+JCd8Pl0=", "After L33t variant");
    this.p.whereToUseL33t = "both";
    assert.equal(btoa(this.p.getPassword(this.url, this.pass)), "Jnx7OHxcfFw=", "Befor & After L33t variant");
});
