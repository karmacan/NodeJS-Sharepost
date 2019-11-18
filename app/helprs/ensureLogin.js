// In case if one helper contains more than one function:
// HLRP.js
//module.exports = {f1: function(...), ...}
// APP.js
// const {f1, ...} = require('./helprs/HLRP')

// PATH PROTECTION (PREVENT URL ACCESS TO UNAVAILABLE ROUTES)
module.exports = function(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    else {
        if (req.url == '/add') req.flash('auth_err', 'Login before add idea!');
        if (req.url == '/ideas') req.flash('auth_err', 'Login before observe ideas!');
        if (req.url.includes('/edit')) req.flash('auth_err', 'Login before edit idea!');
        res.redirect('/login');
    }
}