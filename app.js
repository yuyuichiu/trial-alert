const express = require('express');
const bodyParser = require('body-parser');
const { Client } = require('pg');

const authController = require('./controllers/authController');

const app = express();
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));

const client = new Client({
  user: 'levspiguasqydw',
  host: 'ec2-3-237-55-151.compute-1.amazonaws.com',
  database: 'd79nu0eqsdkct1',
  password: '11af3efcd9554bc6e1ef0f39ab2a5fce88e13f3ca44ea515be4512ae00d79b7a',
  port: 5432
})
client.connect();

client.query('SELECT NOW()', (err, res) => {
  console.log(err, res);
  client.end();
})  

// User Event Dashboard
app.get('/dashboard', (req, res) => {
  return res.render('dashboard.ejs', { title: 'Dashboard' })
})

// User Login
app.get('/login', authController.getLogin);
app.post('/login', authController.postLogin);

// User Register
app.get('/register', authController.getRegister);
app.post('/register', authController.postRegister);

app.get('/', (req, res) => {
  return res.render('index.ejs', { title: 'index page' });
})

app.listen(3000);
console.log('APP HOSTED ON PORT 3000')