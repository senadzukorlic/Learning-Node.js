const bcrypt = require("bcryptjs")
const User = require("../models/user")

exports.getLogin = (req, res, next) => {
  res.render("auth/login", {
    path: "/login",
    pageTitle: "Login",
    errorMessage: req.flash("error"),
  })
}
exports.getSignup = (req, res, next) => {
  res.render("auth/signup", {
    path: "/signup",
    pageTitle: "Signup",
  })
}

exports.postLogin = (req, res, next) => {
  const email = req.body.email
  const password = req.body.password
  User.findOne({ where: { email: email } })
    .then((user) => {
      if (!user) {
        req.flash("error", "Invalid email or password.")
        return res.redirect("/login")
      }
      bcrypt
        .compare(password, user.password)
        .then((doMatch) => {
          if (doMatch) {
            req.session.isLoggedIn = true
            req.session.user = { id: user.id, email: user.email }
            return req.session.save((err) => {
              console.log(err)
              res.redirect("/")
            })
          }
          res.redirect("/login")
        })
        .catch((err) => {
          console.log(err)
          res.redirect("/login")
        })
    })
    .catch((err) => console.log(err))
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
      return bcrypt.hash(password, 12) //nacin za hesiranje lozinke
    })
    .then((hashedPassword) => {
      return User.create({ email: email, password: hashedPassword })
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
