/**
 * Dependencies
 */
var OAuth2Strategy = require('passport-oauth2')
var InternalOAuthError = require('passport-oauth2').InternalOAuthError
var util= require('util');
const {post} = require("axios");
const SubStrategy = require("./subStrategy");

/**
 * @typedef {Object} StrategyOptions
 * @property {string} clientName
 * @property {string[]} scopes
 * @property {string} redirectUri
 */
/**
 * `Strategy` constructor.
 *
 * The Mastodon authentication strategy authenticates requests by delegating to
 * Mastodon via the OAuth2.0 protocol, Additionally it creates oAuth apps on the fly
 *
 * Applications must supply a `verify` callback which accepts an `accessToken`,
 * `refreshToken` and service-specific `profile`, and then calls the `cb`
 *
 * Applications must supply a `getProvider` callback which accepts an `instanceUrl`,
 * and then calls the `done` with (instanceURL, clientKey, clientSecret)
 *
 * @constructor
 * @param {StrategyOptions} options
 * @param {function} verify
 * @param {function} getProvider
 * @access public
 */
function Strategy(options, verify, getProvider) {
    options = options || {};

    options.scopes = options.scopes || ['read', 'write'];

    this.clientName = options.clientName;
    this.scopes = options.scopes;
    this.redirectUri = options.redirectUri;
    this.website = options.website || '';


    if (!options.clientName) throw new Error('clientName is required');
    if (!options.scopes) throw new Error('scopes is required');
    if (!options.redirectUri) throw new Error('redirectUri is required');

    this._originalOptions = options.oAuthOptions;
    this._verify = verify;
    this._getProvider = getProvider;

    this.name = 'mastodon-autoregister';

}
/**
 * Inherits from `OAuth2Strategy`
 */
util.inherits(Strategy, OAuth2Strategy);

Strategy.prototype.authenticate = function (req, options) {


    let instanceUrl = options.instanceUrl;
    if (options.instanceFn && typeof options.instanceFn === 'function') {
        instanceUrl = options.instanceFn(req);
    }

    if(!instanceUrl){
        instanceUrl = req.params?.instance || req.query?.instance || req.body?.instance;
    }

    if (!instanceUrl) {
        return this.fail({ message: 'Instance not provided' });
    }

    if (!instanceUrl.startsWith('https:') && !instanceUrl.startsWith('http:')) {
        instanceUrl = 'https://' + instanceUrl;
    }

    this._getProvider(instanceUrl, (clientKey, clientSecret) => {
        if (!clientKey || !clientSecret) {
            return this.fail({ message: 'Instance not found' });
        }

        const strategy = new SubStrategy({
            instanceUrl: instanceUrl,
            authorizationURL: `${instanceUrl}/oauth/authorize`,
            tokenURL: `${instanceUrl}/oauth/token`,
            clientID: clientKey,
            clientSecret: clientSecret,
            callbackURL: this.redirectUri + '?instance=' + instanceUrl,
            ...this._originalOptions
        }, this._verify);

        // Pass context from this to strategy (ugly!)
        strategy.error = this.error;
        strategy.success = this.success;
        strategy.redirect = this.redirect;
        strategy.pass = this.pass;
        strategy.fail = this.fail;

        try {
            OAuth2Strategy.prototype.authenticate.call(strategy, req, options);
        } catch (err) {
            return this.error(err);  // Proper error handling
        }
    });
};


Strategy.prototype.createApplication = function(instanceUrl, done){

    console.log('creating new oAuth app for', instanceUrl);

    post(`${instanceUrl}/api/v1/apps`, {
            client_name: this.clientName,
            redirect_uris: this.redirectUri,
            scopes: this.scopes,
            website: this.website
    }).then( response => {
        return done(null, response.data);
    }).catch( error => {
        return done(error, null);
    });

};

/**
 * Expose `Strategy`.
 */
module.exports = Strategy;