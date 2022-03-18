const nodemailer = require('nodemailer');
const schedule = require('node-schedule');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { 
    user: 'yuyuichiu448@gmail.com',
    pass: 'zfbxlbqkkgnxpvzh'
  }
})

const mailOptions = {
  from: 'Friendly Person <yuyuichiu448@gmail.com>',
  to: 'yuichiuyu1915@gmail.com',
  subject: 'Nodemailer test',
  html: '<h1 style="color:red; font-family: \'time news roman\';">This is sent by an automation.</h1><p>sent by nodemailer</p>'
}

function sendEmail(client) {
  client.sendMail(mailOptions, (err, info) => {
    if(err) {
      console.log(err)
    } else {
      console.log('Email sent successfully:', info)
    }
  })
}

const date = new Date(2022, 2, 18, 22, 8, 0);
console.log(date)

const job = schedule.scheduleJob(date, () => {
  sendEmail(transporter);
})