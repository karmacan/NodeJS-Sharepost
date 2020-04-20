////////////////////////////////////////
// SETUP SERVER

const express = require('express'); // plug express module to app (path to module)
const app = express(); // allows to use express methods (GET, POST, ...)

const port = process.env.PORT || 5000; // process.env.PORT for Heroku

app.listen(port, () => {
    console.log(`[_dev_] Server started on port ${port}...`);
});

////////////////////////////////////////
// Exp Handlebars

const exphbs = require('express-handlebars');

app.set('view engine', 'hbs');

const main = {
    partialsDir: "./app/views/partials", 
    layoutsDir: "./app/views/layouts", 
    defaultLayout: 'center', 
    extname: '.hbs'
};
app.engine('hbs', exphbs(main)); // set default layout (views/layouts/main.hbs)

app.set('views', './app/views'); // reset default views folder

////////////////////////////////////////
// BodyParser [depr] (grand access to req.body)

const bp = require('body-parser');

app.use(bp.urlencoded({extended: false}));
app.use(bp.json());

////////////////////////////////////////
// Mongoose (DB)

const mongoose = require('mongoose');
const { mongConnectManaged, mongConnectFailed } = require('./helprs/mongLog');

const database = require('./config/database');
const mongoPath = database.mongoPath;
mongoose.connect(mongoPath).then(mongConnectManaged).catch(mongConnectFailed); // Promise

// DB MODELS
require('./models/Idea.js');
require('./models/User.js');
const IdeaModel = mongoose.model('Idea');
const UserModel = mongoose.model('User');

////////////////////////////////////////
// Method Override

// Overrides client put/delete requests
// with url query ?_method=METHOD
// to corresponding server event listener method

const methodOverride = require('method-override');

app.use(methodOverride('_method'));

////////////////////////////////////////
// Exp Session

// Сессия позволяет использовать кастомные переменные 
// req.session.VARIABLE
// внутри запроса
// которые хранят свое значение 
// даже после окончания запроса
// но в течении времени пока пользователь на сайте

const expses = require('express-session'); // for flash

app.use(expses({
    secret: '',
    resave: true,
    saveUninitialized: true
}));

////////////////////////////////////////
// Flash

const flash = require('connect-flash');

app.use(flash());

////////////////////////////////////////
// PassportJS

const passport = require('passport'); // strategy defines in /config/passport.js

app.use(passport.initialize());
app.use(passport.session());

// PASSPORT CONFIG !!! THROW required passport instance to passport.js !!!

require('./config/passport.js')(passport); // separation middleware from APP [IIF]

////////////////////////////////////////
// Bcrypt

const bcrypt = require('bcryptjs');

////////////////////////////////////////
// ESTABLISH PUBLIC STATIC FOLDER

const path = require('path'); // inner NodeJS module for path operations !!! public static folder !!!

app.use(express.static(path.join(__dirname, 'public'))); // default dir for including files on client side

////////////////////////////////////////
// MIDDLEWARE FUNCTION FOR GLOBAL VARS

// Binds res.locals.VARIABLE for _msg.hbs with flash event
// Assigns res.locals.VARIABLE when flash event emmit in request
// Free res.locals.VARIABLE on page refresh or redirrect

const setGlobal = function(req, res, next) {
    // Global
    res.locals.added_msg = req.flash('added_msg');
    res.locals.updated_msg = req.flash('updated_msg');
    res.locals.deleted_msg = req.flash('deleted_msg');
    res.locals.signup_msg = req.flash('signup_msg');
    res.locals.signup_err = req.flash('signup_err');
    res.locals.login_err = req.flash('login_err'); // @@@ from password to _msg
    
    res.locals.user = req.user || null; // after login to _navbar

    res.locals.auth_err = req.flash('auth_err');
    res.locals.access_err = req.flash('access_err');

    next();
}

app.use(setGlobal);

////////////////////////////////////////////////////////////////////////////////
// ROUTES HANDLERS (render)
////////////////////////////////////////////////////////////////////////////////

const getReqRoot = function(req, res) {
    const pkg = { 
        title: "Welcome",
        section: "Jot down your video ideas with VidJot!" 
    }; // object sent to index.hbs

    res.render('index', pkg); // looking for index.hbs in default views folder
}

const getReqAbout = function(req, res) {
    res.render('about');
}

const getReqAddIdea = function(req, res) {
    res.render('add');
}

const postReqAddIdea = function(req, res) {
    // SERVER SIDE VALIDATION
    let errors = [];
    if (!req.body.title) {
        errors.push({text: 'Enter a title!'});
    }
    if (!req.body.details) {
        errors.push({text: 'Enter the details!'});
    }
    if (errors.length != 0) {
        const pkg = {
            errors: errors,
            title: req.body.title,
            details: req.body.details
        }
        res.render('add', pkg);
    }
    else {
        // SEND DATA TO MongoDB
        const ideaData = {
            title: req.body.title,
            details: req.body.details,

            user: req.user.id /* ACCESS CONTROL */

        }
        const im = new IdeaModel(ideaData);
        im.save().then((idea) => { 
            // !!! REDIRECT TO ANOTHER PAGE WITH SENDING DATA !!! (REPLACE BY FLASH)
            //let query = ''; // data sends as url string query
            //query += '?added=true';
            //query += `&title=${idea.title}`;

            req.flash('added_msg', 'Item was added!');

            res.redirect('/ideas'/* + query*/);
        }); // Promise
    }
}

const getReqIdeas = function(req, res) {
    // !!! FETCHED DATA FROM REDIRECTING PAGE !!! (NO NEED BECAUSE OF FLASH)
    //const data = {
    //    title: req.query.title,
    //    added: req.query.added,
    //    updated: req.query.updated,
    //    removed: req.query.removed
    //}

    // FETCH DATA FROM MongoDB
    //IdeaModel.find() /* show all */

    IdeaModel.find({user: req.user.id}) /* ACCESS CONTROL */

    .sort({date: 'asc'}) /* sort by addition date (ascendant) */
    .then((ideas) => {
        res.render('ideas', {ideas: ideas/*, data: data */});
    });
}

const getReqEditIdea = function(req, res) {
    // RENDER WITH FOUND OBJECT
    const aim = {_id: req.params.id}; // object with id in URL
    IdeaModel.findOne(aim).then((idea) => {
        
        if (idea.user != req.user.id) /* ACCESS CONTROL */ {
            req.flash('access_err', 'This idea is not yours!');
            res.redirect('/ideas');
            return;
        }

        res.render('edit', {idea: idea});
    });
}

const putReqUpdateIdea = function(req, res) {
    const aim = {_id: req.params.id};
    IdeaModel.findOne(aim).then((idea) => {
        idea.title = req.body.title;
        idea.details = req.body.details;
        // UPDATE IN MondoDB
        idea.save().then((idea) => {
            //let query = '';
            //query += '?updated=true';
            //query += `&title=${idea.title}`;

            req.flash('updated_msg', 'Item was updated!');

            res.redirect('/ideas'/* + query*/);
        });
    });
}

const delReqRemoveIdea = function(req, res) {
    const aim = {_id: req.params.id};
    IdeaModel.remove(aim).then(() => {
        //let query = '';
        //query += '?removed=true';
        
        req.flash('deleted_msg', 'Item was deleted!');
        
        res.redirect('/ideas'/* + query*/);    
    });
}

const getReqSignupUser = function(req, res) {
    // USER SIGNUP ROUTE
    res.render('signup');
}

const getReqLoginUser = function(req, res) {
    // USER LOGIN ROUTE
    res.render('login');
}

const postReqSignupUser = function(req, res) {
    let errors = [];
    if (req.body.password != req.body.repassword) {
        errors.push({text: 'Passwords did not match!'});
    }
    if (req.body.password.length < 4) {
        errors.push({text: 'Passwords must be at least 4 characters!'});
    }
    if (errors.length > 0) {
        const pkg = {
            errors: errors,
            name: req.body.name,
            email: req.body.email
        };
        res.render('signup', pkg);
    }
    else {
        // CHECK IF EMAIL IS NOT REPEAT
        const aim = {email: req.body.email};
        UserModel.findOne(aim).then((user) => {
            if (user) {
                req.flash('signup_err', 'Email have already registered!');
                res.redirect('/login');  
            }
            else {
                const userData = {
                    name: req.body.name,
                    email: req.body.email,
                    password: String(req.body.password) /* !!! to string !!! */
                }
                
                // ENCRYPT PASSWORD
                const saltRounds = 10;
                bcrypt.genSalt(saltRounds).then((salt) => {
                    bcrypt.hash(userData.password, salt).then((hash) => {
                        userData.password = hash;
                        // SEND DATA TO MongoDB
                        const um = UserModel(userData);
                        um.save().then((user) => {
                            req.flash('signup_msg', 'You are successfully registered!');
                            res.redirect('/login');    
                        });
                    });
                });
            }
        });
    }
}

const postReqLoginUser = function(req, res, next) {
    const strategy = 'local';
    const options = {
        successRedirect: '/ideas', /* get access to req.user */
        failureRedirect: '/login',
        failureFlash: true /* flash */
    };
    passport.authenticate(strategy, options)(req, res, next); // instead of doing custom functionality (IIF)
}

const getReqLogoutUser = function(req, res) {
    req.logout(); // inner passport method
    res.redirect('/login');
}

////////////////////////////////////////////////////////////////////////////////
// ROUTES

const ensureLogin = require('./helprs/ensureLogin.js');

app.get('/', getReqRoot); // get request to app's root (/index.hbs)
app.get('/about', getReqAbout); 

app.get('/add', ensureLogin /* +hlpr */, getReqAddIdea); // url
app.post('/ideas', postReqAddIdea); // submit

app.get('/ideas', ensureLogin /* +hlpr */, getReqIdeas);

app.get('/edit/:id', ensureLogin /* +hlpr */, getReqEditIdea);
app.put('/ideas/:id', putReqUpdateIdea);

app.delete('/ideas/:id', delReqRemoveIdea);

app.get('/signup', getReqSignupUser);
app.get('/login', getReqLoginUser);

app.post('/signup', postReqSignupUser); // url query may stay the same as long as they have different methods
app.post('/login', postReqLoginUser);
app.get('/logout', getReqLogoutUser);