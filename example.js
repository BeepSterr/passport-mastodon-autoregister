const express = require('express');
const app = express();
const passport = require('passport');
const FsMap = require("./fsmap");
const MastodonStrategy = require('./lib/index').MastodonStrategy;
const session = require('express-session');

let sess = session({
    secret: "bla"
})

app.use(sess);

// Temporary storage
const storage = new Map();
const users = new Map();

// User serialization & deserialization for sessions
passport.serializeUser(function(user, done) {
    users.set(user.id, user);
    done(null, user.id);
});

passport.deserializeUser(function(user, done) {
    done(null, users.get(user));
});

storage.set('localhost', {
    clientKey: 1,
    clientSecret: 2
});

app.use(passport.initialize());
app.use(passport.session(sess));

// Set up the Mastodon-Autoregister Strategy with the following options:
passport.use(new MastodonStrategy({

    // Name for the oAuth app. This will be shown to the user on the consent screen
    clientName: 'Mastodon Test App',

    // scopes for the oAuth app, see: https://docs.joinmastodon.org/api/oauth-scopes/
    // IMPORTANT: when logging in you cannot request more scopes than provided here (e.g. you can't request 'write' later if it's not here)
    scopes: ['read', 'write'],

    // The URL to redirect to after the user has logged in. Cannot be changed later, so make sure it's correct
    redirectUri: 'http://localhost:3000/auth/callback',

    oAuthOptions: {
        scope: ['read', 'write'], // The scopes you want to request on authentication
    }

}, function(accessToken, refreshToken, profile, cb) {
    return cb(null, profile);
}, function (instanceUrl, done) {

    let provider = storage.get(instanceUrl);
    provider ? done(provider.clientKey, provider.clientSecret) : this.createApplication(instanceUrl, (err, provider) => {

        if(err) {
            console.error('Error creating application', err);
            process.exit();
        }

        console.log('after createApplication', instanceUrl, provider);
        storage.set(instanceUrl, {
            clientKey: provider.client_id,
            clientSecret: provider.client_secret
        });
        done(provider.client_id, provider.client_secret);
    });
}));

app.get('/', (req, res) => {
    res.json({
        user: req.user,
        session: req.session
    });
});

app.get('/auth',
    passport.authenticate('mastodon-autoregister', { failWithError: true }));

app.get('/auth/callback',
    passport.authenticate('mastodon-autoregister', { failWithError: true }),
    function(req, res) {
        res.redirect('/');
    });

app.listen(3000);