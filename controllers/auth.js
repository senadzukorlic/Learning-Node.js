const User = require("../models/user")

exports.getLogin = (req, res, next) => {
  // const isLoggedIn = req.get("Cookie").split(";")[0].trim().split("=")[0]
  res.render("auth/login", {
    path: "/login",
    pageTitle: "Login",
    isAuthenticated: false,
  })
}

exports.postLogin = (req, res, next) => {
  User.findByPk(1)
    .then((user) => {
      req.session.isLoggedIn = true
      req.session.user = user
      res.redirect("/")
    })
    .then((err) => console.log(err))
}

exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    console.log(err)
    res.redirect("/")
  })
}
