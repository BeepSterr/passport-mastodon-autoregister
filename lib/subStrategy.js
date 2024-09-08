/**
 * Dependencies
 */
var OAuth2Strategy = require('passport-oauth2');
const { post } = require('axios');

/**
 * SubStrategy class
 * Extends OAuth2Strategy to handle Mastodon-specific behavior
 */
class SubStrategy extends OAuth2Strategy {
    constructor(options, verify) {
        super(options, verify);

        this.instanceUrl = options.instanceUrl;

        this.name = 'mastodon-' + options.clientID;
        if (this._oauth2) {
            this._oauth2.useAuthorizationHeaderforGET(true);
        }
    }
}

SubStrategy.prototype.userProfile = function(accessToken, done) {
    var self = this;
    this._oauth2.get(`${this.instanceUrl}/api/v1/accounts/verify_credentials`, accessToken, function(err, body, res) {
        if (err) {
            return done(new Error('Failed to parse the user profile.'));
        }

        try {
            var parsedData = JSON.parse(body);
        }
        catch (e) {
            return done(new Error('Failed to parse the user profile.'));
        }

        var profile = parsedData; // has the basic user stuff
        profile.provider = 'mastodon';
        profile.instance = this.instanceUrl;
        profile.accessToken = accessToken;

        done(null, profile);

    }.bind(this));
};

/**
 * Expose SubStrategy
 */
module.exports = SubStrategy;
