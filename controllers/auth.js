const User = require("../models/user")

exports.getLogin = (req, res, next) => {
  res.render("auth/login", {
    path: "/login",
    pageTitle: "Login",
    isAuthenticated: false,
  })
}
exports.getSignup = (req, res, next) => {
  res.render("auth/signup", {
    path: "/signup",
    pageTitle: "Signup",
    isAuthenticated: false,
  })
}

exports.postLogin = (req, res, next) => {
  req.session.isLoggedIn = true
  res.redirect("/")
}

exports.postSignup = (req, res, next) => {
  const email = req.body.email
  const password = req.body.password
  const confrimPassword = req.body.confrimPassword
  User.findOne({ where: { email: email } })
    .then((userDoc) => {
      if (userDoc) {
        return res.redirect("/signup")
      }
      return User.create({ email: email, password: password })
    })
    .then((result) => {
      res.redirect("/login")
    })
    .catch((err) => {
      console.log(err)
    })
}

exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    console.log(err)
    res.redirect("/")
  })
}
