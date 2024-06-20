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

const username = '-';
const password = '-';
const clusterId = '-';
const dbName = '-';


const MONGODB_URI =
    'mongodb+srv://'+username+':'+password+'@' + clusterId + '.mongodb.net/' + dbName+ '?retryWrites=true&w=majority&appName=Cluster0';

const app = express();
const store = new MongoDBStore({
    uri: MONGODB_URI,
    collection: 'sessions',
});
const csrfProtection = csrf({
    getSecret: () => 'supersecret',
    getTokenFromRequest: (req) => req.body._csrf,
});
//console.log('CSRF Protection: '  + csrfProtection.doubleCsrfProtection);

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(
    session({
        secret: 'my secret',
        resave: false,
        saveUninitialized: false,
        store: store,
    })
);
/** CSRF-CSRF start */
app.use(cookieParser('supersecrettest'));
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
    res.locals.csrfToken = req.csrfToken();
    console.log('isAuthenticated: ' + res.locals.isAuthenticated); 
    console.log('CSRF token: ' + res.locals.csrfToken);
    next();
});
/** CSRF-CSRF end */

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