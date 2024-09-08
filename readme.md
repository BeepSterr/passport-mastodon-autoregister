# passport-mastodon-autoregister
Passport strategy for authentication with any Mastodon instance through the OAuth 2.0.
This strategy creates a oAuth App on the Mastodon instance and passes the required details to [passport-oauth2](https://github.com/jaredhanson/passport-oauth2).

## Installation
```bash
npm install passport-mastodon-autoregister
``` 

## Usage

#### Configure Strategy
It's important to know you cannot pass the same arguments to this strategy. If you want to pass arguments like `passReqToCallback` to the created [passport-oauth2](https://github.com/jaredhanson/passport-oauth2) strategy, you can pass them under the `oAuthOptions` key.
```javascript
passport.use(new MastodonStrategy({

    clientName: 'Mastodon Test App',
    scopes: ['read', 'write'],
    redirectUri: 'https://example.org/auth/callback',

    oAuthOptions: {}

}, function(accessToken, refreshToken, profile, cb) {
    return cb(null, profile);
}, function (instanceUrl, done) {

    let provider = storage.get(instanceUrl);
    provider ? done(provider.clientKey, provider.clientSecret) : this.createApplication(instanceUrl, (err, provider) => {

        if(err) {
            console.error('Error creating application', err);
            return err;
        }

        storage.set(instanceUrl, {
            clientKey: provider.client_id,
            clientSecret: provider.client_secret
        });
        done(provider.client_id, provider.client_secret);
    });
}));
```
This strategy requires a second callback function to create the oAuth App on the Mastodon instance. 
You should store the clientKey and clientSecret to avoid creating a new oAuth App on every request.

#### Authenticate Requests

Use `passport.authenticate()`, specifying the `'mastodon-autoregister'` strategy, to
authenticate requests.

For example, as route middleware in an [Express](http://expressjs.com/)
application:

```js
app.get('/auth',
  passport.authenticate('mastodon-autoregister'));

app.get('/auth/callback',
  passport.authenticate('mastodon-autoregister', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
  });
```

## Example
An example implementation can be found in the [example.js](example.js) file.

## Credits
- nicholastay's [passport-discord](https://github.com/nicholastay/passport-discord) for basic structure and inspiration.