const https = require('https');

const keepalive = setInterval(() => {
  console.log('Pop~')
  https.get('https://yuyuichiu.com');
}, 5)