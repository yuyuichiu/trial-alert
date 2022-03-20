const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { Pool } = require('pg');
const hash = require('object-hash');
const { isValidDate, isValidTime, sendEmail } = require('./utility/util');
const scheduler = require('node-schedule');
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
  saveUninitialized: true,
  cookie: { 
    // expiration time, in ms
    maxAge: 30 * 24 * 60 * 60 * 1000
  }
}))

// Session setup
app.use(function(req, res, next) {
  res.locals.session = req.session;
  next();
});

// ROUTES
// User Dashboard
app.get('/dashboard', (req, res) => {
  if(!req.session.user) { return res.redirect('/login') }

  let queryText = "SELECT id, title, description, TO_CHAR(eventdate, 'DD/MM/YYYY') as eventdate, TO_CHAR(alertdate, 'DD/MM/YYYY HH24:MI') as alertdate FROM Events WHERE user_id=$1";
  client.query(queryText, [req.session.user.id], (err, result) => {
    if(err) {
      console.log('Error on dashboard loading...' + err);
      return res.render('dashboard.ejs', { events: {} })
    }
    
    let events = [];
    for(let i = 0; i < result.rowCount; i++) {
      events.push({
        id: result.rows[i].id,
        title: result.rows[i].title,
        description: result.rows[i].description || '',
        eventDate: result.rows[i].eventdate,
        alertDate: result.rows[i].alertdate || 'Inactive'
      })
    }

    return res.render('dashboard.ejs', { events: events })
  })
})

// Event details page (for editing)
app.get('/event/:id', (req, res) => {
  return res.send('TODO: Event detail page.')
})

// Event delete page (post only)
app.post('/event/delete/:id', (req, res) => {
  if(isNaN(req.params.id)) { return res.redirect('/'); }
  if(!req.session.user) { return res.redirect('/login') }

  client.query(`DELETE FROM Events WHERE id=${+req.params.id} AND user_id=${req.session.user.id};`, (err, result) => {
    if(err) { console.log(err) }
    return res.redirect('/dashboard');
  })
})

// Event entry form
app.get('/new-event', (req, res) => {
  if(!req.session.user) { return res.redirect('/login') }
  return res.render('new-event.ejs')
})

app.post('/new-event', (req, res) => {
  let title = req.body.title;
  let description = req.body.description;
  let eventDate = req.body.eventDate;
  let alertDate = req.body.alertDate;
  let alertTime = req.body.alertTime;
  let isoTime = req.body.isoTime;
  let alertDateTime = (alertDate && alertTime) ?`${alertDate} ${alertTime}` : null;

  // Error handling
  if (!title || !eventDate) {
    return res.render('new-event.ejs', { userData: req.body, error: 'Title and Date cannot be empty.' });
  }
  if(title.length > 200 || description.length > 300) {
    return res.render('new-event.ejs', { userData: req.body, error: 'Please keep your input short.' });
  }
  if(!isValidDate(eventDate) || (alertDate && alertTime && !isValidDate(alertDate))) {
    return res.render('new-event.ejs', { userData: req.body, error: 'Invalid date in input.' });
  }
  if((alertDate && alertTime && !isValidTime(alertTime))) {
    return res.render('new-event.ejs', { userData: req.body, error: 'Invalid time in input.' });
  }
  
  // Enter valid data into events table.
  let queryText = 'INSERT INTO Events (user_id, title, description, eventDate, alertDate, alertTimeUTC) VALUES ($1, $2, $3, $4, $5, $6);'
  let queryValues =  [req.session.user.id, title, description, eventDate, alertDateTime, isoTime];
  client.query(queryText, queryValues, (err, result) => {
    if(err) {
      console.log(err);
      return res.render('new-event.ejs', { userData: req.body, error: 'Something wrong happened on the database. Please try again.' });
    }

    return res.redirect('/dashboard');
  })

})

// User Login
app.get('/login', (req, res) => {
  if(req.session.user) { return res.redirect('/dashboard') }
  return res.render('auth/login.ejs', { alert: req.query.alert });
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
        id: result.rows[0].id,
        mail: result.rows[0].usermail,
        firstname: result.rows[0].firstname,
        lastname: result.rows[0].lastname
      }
      return res.redirect('/dashboard')
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
  return res.render('auth/register', { data: {} })
})

app.post('/register', (req, res) => {
  let firstname = req.body.firstname;
  let lastname = req.body.lastname;
  let mail = req.body.usermail;
  let password = req.body.password;
  let confirmPassword = req.body['confirm-pw'];
  let userData = { firstname, lastname, mail };

  // Reject on form input errors
  let emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
  if(!emailRegex.test(mail)) {
    return res.render('auth/register', { data: userData, error: 'Invalid Email Address' })
  }
  if(firstname.length > 100 || lastname.length > 100 || mail.length > 100) {
    return res.render('auth/register', { data: userData, error: 'Input character limit exceeded, we cap at 100 characters.' })
  }
  if(password.length < 8) {
    return res.render('auth/register', { data: userData, error: 'Password is too short, make it at least 8 characters long.' })
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

    // User is unique, register user into database
    let queryTxt = `INSERT INTO Users (firstname, lastname, usermail, password) VALUES ($1, $2, $3, $4)`;
    let hashPw = await hash(req.body.password, { algorithm: 'sha256' });
    client.query(queryTxt, [firstname, lastname, mail, hashPw], (err, result) => {
      if(err) { throw err }
      return res.redirect('/login?alert=Account%20Created')  // %20 === " "
    })
  })
})

// Home page
app.get('/', (req, res) => {
  return res.render('index.ejs');
})

// Error route
app.get('*', (req, res) => {
  res.status(404);
  return res.render('error.ejs');
})

// Every minutes, get all outstanding alerts with condition of "now() > alertDate"
// The brackets are correctly placed, but addon is bugged.
scheduler.scheduleJob('* * * * *', () => {
  // console.log('Timer checked on', new Date())
  client.query('SELECT Events.*, Users.lastname, Users.usermail FROM Events INNER JOIN Users ON Users.id=Events.user_id WHERE NOW() >= Events.alertTimeUTC;', (err, result) => {
    if(err) { console.log(err) }
    else if(result.rowCount > 0) {
      for(let i = 0; i < result.rowCount; i++) {
        sendEmail({
          from: 'Trial Alert Reminder Bot <trialalert1915@gmail.com>',
          to: result.rows[0].usermail,
          subject: `Event Reminder - ${result.rows[i].title}`,
          html: `<p>Dear ${result.rows[0].lastname},</p>
          <p>You have set an alert for your event: <b>${result.rows[i].title}</b></p>
          <p>Event Date: ${result.rows[i].eventdate.toLocaleDateString()}</p>
          <p>Alert Time: ${result.rows[i].alertdate.toLocaleString()}</p>
          <br/><br/>
          <small style='font-style: italic;'>This is an automated email, please do not reply. Should you have enquires, please contact Mr.Yu by yuichiuyu1915@gmail.com</small>
          <br/><br/>
          <p>Regards,</p>
          <p>Trial Alert Group</p>`
        }, () => {
          client.query(`UPDATE Events SET alertDate=NULL, alertTimeUTC=NULL WHERE id=${+result.rows[i].id}`, (error, result) => {
            console.log('Alert is made and thus cleared from the corresponding event.')
          });
        });
      }
    }
  })
});

// Simple Interval to keep Heroku awake
const https = require('https');
const keepalive = setInterval(() => {
  https.get('https://trial-alert-webapp.herokuapp.com/dashboard');
  https.get('https://yuyuichiu.com/blog');
}, 300000)