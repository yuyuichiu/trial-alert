const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { Pool } = require('pg');
const hash = require('object-hash');
require('dotenv').config();

// Connect to database
const client = new Pool({
  // https://devcenter.heroku.com/articles/connecting-heroku-postgres#connecting-in-node-js
  // Use process.env.DATABASE_URL in deployment because the url changes periodically.
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Host express app once connected to database
client.connect((err) => {
  if(err) throw err;
  console.log('Connected to database!');
  app.listen(process.env.PORT);
  console.log(`APP HOSTED ON PORT ${process.env.PORT}`);
});

const app = express();
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
  store: new pgSession({
    pool: client,
    tableName: 'user_sessions',
    createTableIfMissing: true
  }),
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true
}))

// Session setup
app.use(function(req, res, next) {
  res.locals.session = req.session;
  next();
});

// ROUTES
// User Dashboard
app.get('/dashboard', (req, res) => {
  return res.render('dashboard.ejs')
})

// User Login
app.get('/login', (req, res) => {
  if(req.session.user) {
    return res.redirect('/dashboard')
  }
  return res.render('auth/login.ejs', { error: null, alert: req.query.alert });
});

app.post('/login', async (req, res) => {
  // Log user in with session
  let mail = req.body.usermail;
  let password = await hash(req.body.password, { algorithm: 'sha256' });

  client.query("SELECT * FROM Users WHERE usermail=$1 AND password=$2", [mail, password], (err, result) => {
    if (err) { throw err }
    // If result row exist => successful login
    if(result.rowCount === 1) {
      req.session.user = {
        mail: result.rows[0].usermail,
        firstname: result.rows[0].firstname,
        lastname: result.rows[0].lastname
      }
      return res.redirect('/')
    }
    else {
      return res.render('auth/login.ejs', { error: 'Invalid Credentials' })
    }
  })
});

app.get('/logout', (req, res) => {
  // Log user out by destroying the session
  req.session.destroy();
  return res.redirect('/');
})

// User Register
app.get('/register', (req, res) => {
  if (req.session.user) { req.session.destroy() }
  return res.render('auth/register', { data: {}, error: null })
})

app.post('/register', (req, res) => {
  let firstname = req.body.firstname;
  let lastname = req.body.lastname;
  let mail = req.body.usermail;
  let password = req.body.password;
  let confirmPassword = req.body['confirm-pw'];
  let userData = { firstname, lastname, mail }

  // Reject on client side errors
  let emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
  if(!emailRegex.test(mail)) {
    return res.render('auth/register', { data: userData, error: 'Invalid Email Address' })
  }
  if(firstname.length > 100 || lastname.length > 100 || mail.length > 100) {
    return res.render('auth/register', { data: userData, error: 'Input character limit exceeded, we cap at 100 characters.' })
  }
  if(password !== confirmPassword) {
    return res.render('auth/register', { data: userData, error: 'Password does not match' })
  }

  // Lookup database to ensure user is not already taken
  client.query(`SELECT id FROM Users WHERE usermail=$1`, [mail], async (err, result) => {
    if(err) { throw err }
    if(result.rowCount > 0) {
      return res.render('auth/register', { data: userData, error: 'User already exist' })
    }

    // User is unique, register User into database
    let queryTxt = `INSERT INTO Users (firstname, lastname, usermail, password) VALUES ($1, $2, $3, $4)`;
    let hashPw = await hash(req.body.password, { algorithm: 'sha256' });
    client.query(queryTxt, [firstname, lastname, mail, hashPw], (err, result) => {
      if(err) { throw err }
      return res.redirect('/login?alert=Account%20Created')
    })
  })
})

// Home page
app.get('/', (req, res) => {
  return res.render('index.ejs');
})