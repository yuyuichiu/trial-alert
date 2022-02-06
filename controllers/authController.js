exports.getLogin = (req, res) => {
  return res.render('auth/login.ejs', { title: 'Login' })
}

exports.postLogin = (req, res) => {
  // TODO - Log user in with session
}

exports.getRegister = (req, res) => {
  return res.render('auth/register.ejs', { title: 'Register' })
}

exports.postRegister = (req, res) => {
  // TODO - Register user into db
}