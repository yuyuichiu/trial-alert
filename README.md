# Trial Alert
#### Video Demo:  <URL HERE>
#### Description:
  Did you have an experience of entering into free trial and wanted to *be reminded* you to review your subscription near the payment start date? Or just anything you just want to *be reminded*? Trial alert is a download-less web application that remind you of your important moments with scheduled emails. **No marketing email shenanigans, just clean email reminders upon your request**. Let explore how it works!
  
#### Getting Started
  To get started, register an account with your email address. You will need that email to login into your account.
  We do not send non-alert related emails and your credenticals is protected by SHA256 hash function.
  
  After registration and logging into your account, you will be directed into **dashboard**. This is the place where your events and alerts are displayed. Let create an event that you want to be reminded of! 
  
  In the **add event** section, user can input an event with title and date. The description and alarm is optional. To setup an alarm, check the *alert me with email* checkbox and input the date and time you would like to be reminded. As per timezone concern, Trial Alert detects your machine's timezone and intercepts your time based on your timezone. Therefore, just type in the time in your desired timezone! One thing to note is that the event date does not limit when you can set your alarm, the event date is just for your reference whereas the alarm datetime determines when our email notification will trigger.
  
  After that, the event will be submitted into the database. You should be able to see your new event appearing in your dashboard. If you have set up an alarm, it will send an email at your specified time and you will be reminded. However, you can also **edit** or **remove** the event. Editing the event allows you to change the detail and the alarm, and removing the event will delete your event irreversibllly.
  
  At your specified time, you should receive an email from our friendly trial alert bot. It is a simple email that reminds you with the details of the event, so that you can *be reminded*.
  
  Events that triggered the alarm will not be removed from the dashboard. Instead, it will now show an 'Inactive' on the alert time column. If user wish to set up a new alarm for that event, please select the edit button to reactivate the alarm at your desired time.
  
  As a bonus, you can click on the head column to sort your events in alphabetical format by the data on your clicked column. Clicking again will reverse the order of the events. For dates, it will be sort by time order instead.
  
#### Behind the scene
  Trial alert is powered by Express.js with EJS as template engine, with postgreSQL as its database solution. It is hosted on Heroku. Express.js is responsible to handle the routing based on HTTP request received, and output an EJS template engine that renders a template file that is replaced by actual values. The user authentication is handled with Cookie and Sessions as taught in CS50 HTML class, with the third-party module 'express-session' helping on the setup for our authentication system. To enable email notification, third party module 'nodemailer' is adapted to send the email and a clock is setup in our backend service to periocally (once per minute) check whether any alarm should be sent at the moment by using SQL query to filter out any events that had a alert datetime went pass present time. 
  
  The biggest challenge for me on making the project is to figure out how to handle timezone issue. This application will reach globally, which means users will have different timezone preference. By default, heroku powered web applications operates in UTC timezone and does not automatically detect user timezone. It is not practial to simply tell the user to write every alarm time in UTC timezone, so a conversion solution is needed. After some research and testing, I figured out that JavaScript can intercept user timezone on the client side. Thus, I can find a way to convert user input time into UTC timezone before the data is sent to server. As a solution, I intercept the POST data to convert the user time input by adjusting the difference between user timezone and UTC time. This is possible by declaring a new Date() object (built in feature of JavaScript) on user input, and then use .toISOString() to translate into UTC time. The adjusted datetime will then be sent to our Express backend server to further process, thus solving the timezone issue without sacrificing user experience.
