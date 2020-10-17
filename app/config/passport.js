const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserModel = mongoose.model('User'); // load user model

// DEFINE LOCAL STRATEGY
const spec = {
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true /* flash */
};
const handStrategy = function(req /* flash */, email, password, done /* cb */) {
    const aim = {email: email};
    UserModel.findOne(aim).then((user) => {
        // USER NOT FOUND CASE
        if (!user) {
            const er = null;
            const user = false;
            const msg = req.flash('login_err', 'No user found!'); // @@@ to app
            return done(er, user, msg);
        }
        // MATCHING PASSWORD CASE
        const cbMatch = function(er, isMatch) {
            if (er) throw er;
            if (isMatch) return done(null, user);
            if (!isMatch) {
                const er = null;
                const user = false;
                const msg = req.flash('login_err', 'Password is incorrect!'); // @@@ to app
                return done(er, user, msg);
            }
        }
        bcrypt.compare(password, user.password, cbMatch);
    });
}
// Create LS with spec and handled strategy
const ls = new LocalStrategy(spec, handStrategy);

// PASSPORT MIDDLEWARE !!! CATCH required passport instance from main.js !!!

module.exports = function(passport) {
    // Exporting back in APP
    passport.use('local', ls);

    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });
    passport.deserializeUser(function(id, done) {
        UserModel.findById(id, function(err, user) {
            done(err, user);
        });
    });
}