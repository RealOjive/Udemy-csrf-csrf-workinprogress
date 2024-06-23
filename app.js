const path = require('path');

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
/** CSRF-CSRF PACKAGE */
const { doubleCsrf: csrf } = require('csrf-csrf');
const cookieParser = require('cookie-parser');

const errorController = require('./controllers/error');
const User = require('./models/user');

/** REPLACE CONNECTION STRING IF USING ATLAS
 *  "mongodb+srv://<username>:<password>@<cluster-id>.mongodb.net/<dbName>?retryWrites=true&authSource=admin"
 */

const username = -
const password = -
const clusterId = -
const dbName = -

const csrfSecret = 'supersecret';
const sessSecret = 'csrfSecret';
const cookieParserSecret = 'cookieParserSecret';

const MONGODB_URI =
    'mongodb+srv://'+username+':'+password+'@' + clusterId + '.mongodb.net/' + dbName+ '?retryWrites=true&w=majority&appName=Cluster0';

    const app = express();
    const store = new MongoDBStore({
        uri: MONGODB_URI,
        collection: 'sessions',
    });
    const csrfProtection = csrf({
        getSecret: () => csrfSecret,
        getTokenFromRequest: (req) => req.body._csrf,
        cookieName: '__Academ-psifi.x-csrf-token',
        cookieOptions: {
            secure: false
          },
    });
    
    app.set('view engine', 'ejs');
    app.set('views', 'views');
    
    const adminRoutes = require('./routes/admin');
    const shopRoutes = require('./routes/shop');
    const authRoutes = require('./routes/auth');
    
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(express.static(path.join(__dirname, 'public')));
    app.use(
        session({
            secret: sessSecret,
            resave: false,
            saveUninitialized: false,
            store: store,
        })
    );
    /** CSRF-CSRF PACKAGE */
    app.use(cookieParser(cookieParserSecret));
    app.use(csrfProtection.doubleCsrfProtection);
    
    app.use((req, res, next) => {
        if (!req.session.user) {
            return next();
        }
        User.findById(req.session.user._id)
            .then((user) => {
                req.user = user;
                next();
            })
            .catch((err) => console.log(err));
    });
    
    app.use((req, res, next) => {
        res.locals.isAuthenticated = req.session.isLoggedIn;
        res.locals.csrfToken = req.csrfToken({ validateOnReuse: false });
        next();
    });
    
    app.use('/admin', adminRoutes);
    app.use(shopRoutes);
    app.use(authRoutes);
    
    app.use(errorController.get404);
    
    mongoose
        .connect(MONGODB_URI)
        .then((result) => {
            app.listen(3000);
        })
        .catch((err) => {
            console.log(err);
        });